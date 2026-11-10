import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fakeBrowser} from 'wxt/testing/fake-browser';
import {browser} from 'wxt/browser';
import {handleMessage, handleTabClosed, setup} from './tracker';
import {getDay, items} from './storage';

const at = (iso: string) => new Date(iso).getTime();

describe('tracker', () => {
	beforeEach(async () => {
		fakeBrowser.reset();
		vi.spyOn(browser.action, 'setBadgeText').mockResolvedValue(undefined);
		await setup();
	});

	it('creates a user ID on setup', async () => {
		expect(await items.userId.getValue()).toMatch(/^[0-9a-f-]{36}$/);
	});

	it('counts an opened video once per hour', async () => {
		const now = at('2026-11-10T12:00:00');
		await handleMessage({type: 'opened', videoId: 'v1', durationSec: 60}, '1:0', now);
		await handleMessage({type: 'opened', videoId: 'v1', durationSec: 60}, '1:0', now + 1000);
		expect(await getDay('2026-11-10')).toEqual({count: 1, watchedMs: 0, openedMs: 60_000});
		expect(await items.total.getValue()).toEqual({count: 1, watchedMs: 0, openedMs: 60_000});
		expect(await items.startTime.getValue()).toBe(now);
	});

	it('records watched time between play and stop, per player', async () => {
		const start = at('2026-11-09T23:30:00');
		await handleMessage({type: 'play', videoId: 'v1'}, '1:0', start);
		await handleMessage({type: 'play', videoId: 'v2'}, '2:0', start);
		expect(browser.action.setBadgeText).toHaveBeenLastCalledWith({text: 'P'});
		await handleMessage({type: 'stop'}, '1:0', start + 3_600_000);
		expect(await getDay('2026-11-09')).toMatchObject({watchedMs: 1_800_000});
		expect(await getDay('2026-11-10')).toMatchObject({watchedMs: 1_800_000});
		// A second stop for the same player adds nothing.
		await handleMessage({type: 'stop'}, '1:0', start + 7_200_000);
		expect((await items.total.getValue()).watchedMs).toBe(3_600_000);
		expect(browser.action.setBadgeText).toHaveBeenLastCalledWith({text: 'P'});
	});

	it('finishes the players of a closed tab', async () => {
		const start = at('2026-11-10T10:00:00');
		await handleMessage({type: 'play', videoId: 'v1'}, '7:3', start);
		await handleTabClosed(7, start + 60_000);
		expect((await getDay('2026-11-10')).watchedMs).toBe(60_000);
		expect(await items.activePlayers.getValue()).toEqual({});
		expect(browser.action.setBadgeText).toHaveBeenLastCalledWith({text: ''});
	});
});
