import {expect, it} from 'vitest';
import {createPkce} from './dropbox';

it('creates a PKCE verifier and its S256 challenge', async () => {
	const {verifier, challenge} = await createPkce();
	expect(verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
	const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
	expect(challenge).toBe(Buffer.from(digest).toString('base64url'));
});
