import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fakeBrowser} from 'wxt/testing/fake-browser';
import {share} from './api';
import {items} from './storage';

const pending = {type: 'watched' as const, videoId: 'v1', ms: 1000, date: 0};

describe('share', () => {
	beforeEach(async () => {
		fakeBrowser.reset();
		await items.userId.setValue('u1');
		await items.userKey.setValue('k1');
	});

	it('sends the key and keeps failures for a retry', async () => {
		const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', {status: 500}));
		await share([pending]);
		expect(fetch.mock.calls[0]?.[1]?.headers).toMatchObject({'X-YTT-Key': 'k1'});
		expect(await items.failedShare.getValue()).toEqual([pending]);
		expect(await items.keyRejected.getValue()).toBe(false);
	});

	it('drops a share the server refused the key for, and flags it', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', {status: 403}));
		await share([pending]);
		expect(await items.failedShare.getValue()).toEqual([]);
		expect(await items.keyRejected.getValue()).toBe(true);
	});
});
