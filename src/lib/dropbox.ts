import {browser} from 'wxt/browser';
import {items} from './storage';

const CLIENT_ID = '7zgfd8x5bpf8g7p';

class DropboxAuthError extends Error {}

async function authenticate(): Promise<string> {
	const url = new URL('https://www.dropbox.com/oauth2/authorize');
	url.search = new URLSearchParams({client_id: CLIENT_ID, response_type: 'token', redirect_uri: browser.identity.getRedirectURL()}).toString();
	const redirect = await browser.identity.launchWebAuthFlow({url: url.toString(), interactive: true});
	const token = redirect ? new URLSearchParams(new URL(redirect).hash.slice(1)).get('access_token') : null;
	if (!token) {
		throw new Error('Dropbox authentication was cancelled');
	}
	await items.dropboxToken.setValue(token);
	return token;
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

/** Runs a call with the saved token; on an expired token, authenticates again once. */
async function withToken(run: (token: string) => Promise<Response>): Promise<Response> {
	const saved = await items.dropboxToken.getValue();
	try {
		return await run(saved ?? (await authenticate()));
	} catch (error) {
		if (!(error instanceof DropboxAuthError)) {
			throw error;
		}
		return run(await authenticate());
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

export async function disconnect(): Promise<void> {
	await items.dropboxToken.setValue(null);
}
