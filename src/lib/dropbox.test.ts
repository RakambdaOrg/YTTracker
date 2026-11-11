import {afterEach, expect, it, vi} from 'vitest';
import {fakeBrowser} from 'wxt/testing/fake-browser';
import {createPkce, disconnect} from './dropbox';
import {items} from './storage';

afterEach(() => {
	vi.unstubAllGlobals();
	fakeBrowser.reset();
});

it('creates a PKCE verifier and its S256 challenge', async () => {
	const {verifier, challenge} = await createPkce();
	expect(verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
	const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
	expect(challenge).toBe(Buffer.from(digest).toString('base64url'));
});

it('revokes the login at Dropbox on disconnect, even with no cached access token', async () => {
	await items.dropboxRefreshToken.setValue('refresh');
	const fetchMock = vi.fn((url: string) => Promise.resolve(Response.json(url.endsWith('/oauth2/token') ? {access_token: 'fresh', expires_in: 3600} : null)));
	vi.stubGlobal('fetch', fetchMock);
	await disconnect();
	const revoke = fetchMock.mock.calls.find(([url]) => url.endsWith('/token/revoke')) as unknown as [string, RequestInit] | undefined;
	expect(revoke?.[1].headers).toEqual({Authorization: 'Bearer fresh'});
	expect(await items.dropboxRefreshToken.getValue()).toBeNull();
	expect(await items.dropboxAccess.getValue()).toBeNull();
});
