import {beforeEach, describe, expect, it} from 'vitest';
import {fakeBrowser} from 'wxt/testing/fake-browser';
import {browser} from 'wxt/browser';
import {applyImport, buildExport, fromLegacy, legacyDayKey, legacyDurationMs, migrateStorage, parseImport} from './migration';

const dur = (type: string, ms: number) => ({type, milliseconds: ms, seconds: 0, minutes: 0, hours: 0, days: 0});

// Shapes taken from the old YTTUtils.js / service_worker.js.
const legacy = {
	YTT_User_ID: 'uuid-1',
	YTT_Start: 1_700_000_000_000,
	YTT_Share_Stats: true,
	YTT_Debug: false,
	YTT_Weird_Data_Threshold: 172_800_000,
	YTT_Username: 'bob',
	YTT_Dropbox_Access_Token: 'secret',
	YTT_Version: '3.1.3',
	YTT_Active_Players: {12: {time: 1}},
	YTT_IDS: {vid1: 1_700_000_000_000},
	YTT_Failed_Share: [{videoID: 'vid1', type: 'watched', duration: dur('real', 5000), date: 1_700_000_000_000}],
	day3142026: {count: 3, real: {type: 'real', milliseconds: 1, seconds: 2, minutes: 3, hours: 4, days: 0}, total: dur('total', 90_000)},
	day12026: {count: 1, real: dur('real', 1000), total: dur('total', 2000)},
	YTT_Total: {count: 10, real: dur('real', 50_000), total: dur('total', 60_000)},
};

describe('legacy conversion', () => {
	it('converts durations and day keys', () => {
		expect(legacyDurationMs({milliseconds: 1, seconds: 2, minutes: 3, hours: 4, days: 1})).toBe(1 + 1000 * (2 + 60 * (3 + 60 * (4 + 24))));
		expect(legacyDurationMs(undefined)).toBe(0);
		expect(legacyDayKey('day3142026')).toBe('2026-11-10');
		expect(legacyDayKey('day12026')).toBe('2026-01-01');
		expect(legacyDayKey('day3662024')).toBe('2024-12-31');
		expect(legacyDayKey('YTT_Total')).toBeNull();
	});

	it('converts a whole dump', () => {
		expect(fromLegacy(legacy)).toEqual({
			'day:2026-11-10': {count: 3, watchedMs: 4 * 3_600_000 + 3 * 60_000 + 2000 + 1, openedMs: 90_000},
			'day:2026-01-01': {count: 1, watchedMs: 1000, openedMs: 2000},
			total: {count: 10, watchedMs: 50_000, openedMs: 60_000},
			userId: 'uuid-1',
			startTime: 1_700_000_000_000,
			weirdThreshold: 172_800_000,
			username: 'bob',
			dropboxToken: 'secret',
			shareOnline: true,
			debug: false,
			openedIds: {vid1: 1_700_000_000_000},
			failedShare: [{type: 'watched', videoId: 'vid1', ms: 5000, date: 1_700_000_000_000}],
		});
	});

	it('rebuilds the total from the days when legacy totals exist', () => {
		const result = fromLegacy({...legacy, YTT_TotalTime: 1});
		expect(result.total).toEqual({count: 4, watchedMs: 4 * 3_600_000 + 3 * 60_000 + 2000 + 1 + 1000, openedMs: 92_000});
	});
});

describe('storage migration', () => {
	beforeEach(() => {
		fakeBrowser.reset();
	});

	it('migrates v1 storage and removes the old keys', async () => {
		await browser.storage.local.set(legacy);
		await migrateStorage();
		const all = await browser.storage.local.get(null);
		expect(Object.keys(all).sort()).toEqual([
			'day:2026-01-01', 'day:2026-11-10', 'debug', 'dropboxToken', 'failedShare', 'openedIds',
			'schemaVersion', 'shareOnline', 'startTime', 'total', 'userId', 'username', 'weirdThreshold',
		]);
		expect(all.schemaVersion).toBe(2);
	});

	it('reruns an interrupted migration without counting twice', async () => {
		await browser.storage.local.set(legacy);
		await migrateStorage();
		const migrated = await browser.storage.local.get(null);
		// Simulate a crash after the new keys were written and before the old ones were removed.
		fakeBrowser.reset();
		await browser.storage.local.set({...legacy, ...fromLegacy(legacy)});
		await migrateStorage();
		expect(await browser.storage.local.get(null)).toEqual(migrated);
	});

	it('marks a fresh install as current', async () => {
		await migrateStorage();
		expect(await browser.storage.local.get(null)).toEqual({schemaVersion: 2});
	});
});

describe('import and export', () => {
	beforeEach(() => {
		fakeBrowser.reset();
	});

	it('round-trips an export, without the Dropbox token', async () => {
		await browser.storage.local.set(legacy);
		await migrateStorage();
		const exported = await buildExport();
		expect(exported.data).not.toHaveProperty('dropboxToken');
		expect(exported.data).not.toHaveProperty('schemaVersion');

		await browser.storage.local.clear();
		await applyImport(parseImport(JSON.stringify(exported)));
		const all = await browser.storage.local.get(null);
		expect(all['day:2026-11-10']).toEqual({count: 3, watchedMs: 14_582_001, openedMs: 90_000});
		expect(all.userId).toBe('uuid-1');
	});

	it('imports an old export file', () => {
		const oldExport: Record<string, unknown> = {...legacy};
		delete oldExport.YTT_Dropbox_Access_Token;
		expect(parseImport(JSON.stringify(oldExport))['day:2026-01-01']).toEqual({count: 1, watchedMs: 1000, openedMs: 2000});
	});

	it('rejects junk and drops bad values', () => {
		expect(() => parseImport('not json')).toThrow();
		expect(() => parseImport('{"foo": 1}')).toThrow();
		const cleaned = parseImport(JSON.stringify({version: 2, data: {'day:2026-11-10': {count: -5, watchedMs: 'x'}, evil: 1, 'day:../x': {}}}));
		expect(cleaned['day:2026-11-10']).toEqual({count: 0, watchedMs: 0, openedMs: 0});
		expect(cleaned).not.toHaveProperty('evil');
		expect(cleaned).not.toHaveProperty('day:../x');
	});

	it('keeps the current user ID when the file has none', async () => {
		await browser.storage.local.set({userId: 'me', 'day:2020-01-01': {count: 1, watchedMs: 1, openedMs: 1}});
		await applyImport({'day:2026-11-10': {count: 1, watchedMs: 2, openedMs: 3}});
		expect(await browser.storage.local.get(null)).toEqual({userId: 'me', schemaVersion: 2, 'day:2026-11-10': {count: 1, watchedMs: 2, openedMs: 3}});
	});
});
