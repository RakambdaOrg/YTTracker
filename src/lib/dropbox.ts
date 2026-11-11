import {browser} from 'wxt/browser';
import {items} from './storage';

const CLIENT_ID = '7zgfd8x5bpf8g7p';
const TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';
// Refresh a bit before the real expiry, so a call never starts with a dying token.
const EXPIRY_MARGIN_MS = 60_000;

class DropboxAuthError extends Error {}

interface TokenResponse {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
}

const base64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** PKCE verifier (43+ chars of [A-Za-z0-9-_]) and its S256 challenge. */
export async function createPkce(): Promise<{verifier: string; challenge: string}> {
	const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
	const challenge = base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
	return {verifier, challenge};
}

async function requestToken(params: Record<string, string>): Promise<TokenResponse> {
	const response = await fetch(TOKEN_URL, {method: 'POST', body: new URLSearchParams({client_id: CLIENT_ID, ...params})});
	if (!response.ok) {
		throw new DropboxAuthError(`Dropbox token error ${response.status}`);
	}
	return (await response.json()) as TokenResponse;
}

async function saveToken(token: TokenResponse): Promise<string> {
	if (token.refresh_token) {
		await items.dropboxRefreshToken.setValue(token.refresh_token);
	}
	await items.dropboxAccess.setValue({token: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 - EXPIRY_MARGIN_MS});
	return token.access_token;
}

/** Authorization code flow with PKCE; offline access gives a refresh token, so the login is asked once. */
async function login(): Promise<string> {
	const {verifier, challenge} = await createPkce();
	const state = base64Url(crypto.getRandomValues(new Uint8Array(16)));
	const redirectUri = browser.identity.getRedirectURL();
	const url = new URL('https://www.dropbox.com/oauth2/authorize');
	url.search = new URLSearchParams({
		client_id: CLIENT_ID,
		response_type: 'code',
		redirect_uri: redirectUri,
		code_challenge: challenge,
		code_challenge_method: 'S256',
		token_access_type: 'offline',
		// A login only happens on first use or after "Forget": always show the page, or Dropbox reuses its session silently.
		force_reapprove: 'true',
		state,
	}).toString();
	const redirect = await browser.identity.launchWebAuthFlow({url: url.toString(), interactive: true});
	const params = redirect ? new URL(redirect).searchParams : null;
	const code = params?.get('code');
	if (!code || params?.get('state') !== state) {
		throw new Error('Dropbox login was cancelled');
	}
	return saveToken(await requestToken({grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: redirectUri}));
}

async function accessToken(forceRefresh = false): Promise<string> {
	const cached = await items.dropboxAccess.getValue();
	if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
		return cached.token;
	}
	const refreshToken = await items.dropboxRefreshToken.getValue();
	if (refreshToken) {
		try {
			return await saveToken(await requestToken({grant_type: 'refresh_token', refresh_token: refreshToken}));
		} catch (error) {
			if (!(error instanceof DropboxAuthError)) {
				throw error;
			}
			// The refresh token was revoked: log in again.
		}
	}
	return login();
}

async function call(url: string, init: RequestInit, token: string): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set('Authorization', `Bearer ${token}`);
	const response = await fetch(url, {...init, method: 'POST', headers});
	if (response.status === 401) {
		throw new DropboxAuthError();
	}
	if (!response.ok) {
		throw new Error(`Dropbox error ${response.status}: ${await response.text()}`);
	}
	return response;
}

/** Runs a call; on a rejected token, gets a new one once. */
async function withToken(run: (token: string) => Promise<Response>): Promise<Response> {
	try {
		return await run(await accessToken());
	} catch (error) {
		if (!(error instanceof DropboxAuthError)) {
			throw error;
		}
		return run(await accessToken(true));
	}
}

export async function uploadExport(content: string): Promise<void> {
	const arg = JSON.stringify({path: `/YTTracker.${Date.now()}.json`, mode: 'add'});
	await withToken(token => call('https://content.dropboxapi.com/2/files/upload', {
		headers: {'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': arg},
		body: content,
	}, token));
}

/** Downloads the newest export, or returns null when there is none. */
export async function downloadLatestExport(): Promise<string | null> {
	const list = await withToken(token => call('https://api.dropboxapi.com/2/files/list_folder', {
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({path: ''}),
	}, token));
	// shortcut: only the first page of list_folder is read, enough unless the folder holds hundreds of exports.
	const {entries} = (await list.json()) as {entries: {'.tag': string; name: string; id: string}[]};
	const latest = entries
		.filter(e => e['.tag'] === 'file' && /^YTTracker\.\d+\.json$/.test(e.name))
		.sort((a, b) => Number(b.name.split('.')[1]) - Number(a.name.split('.')[1]))[0];
	if (!latest) {
		return null;
	}
	const file = await withToken(token => call('https://content.dropboxapi.com/2/files/download', {
		headers: {'Dropbox-API-Arg': JSON.stringify({path: latest.id})},
	}, token));
	return file.text();
}

/** Revokes the login at Dropbox (best effort) and forgets it locally. */
export async function disconnect(): Promise<void> {
	const refreshToken = await items.dropboxRefreshToken.getValue();
	// Revoking an access token also revokes its refresh token, so get one when none is cached.
	const token = (await items.dropboxAccess.getValue())?.token
		?? (refreshToken ? await requestToken({grant_type: 'refresh_token', refresh_token: refreshToken}).then(t => t.access_token).catch(() => null) : null);
	if (token) {
		await fetch('https://api.dropboxapi.com/2/auth/token/revoke', {method: 'POST', headers: {Authorization: `Bearer ${token}`}}).catch(() => undefined);
	}
	await items.dropboxRefreshToken.setValue(null);
	await items.dropboxAccess.setValue(null);
}
