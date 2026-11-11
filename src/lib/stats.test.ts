import {describe, expect, it} from 'vitest';
import {dayKey, registerOpened, splitByDay, summarize, weirdDays} from './stats';

const at = (iso: string) => new Date(iso).getTime();

describe('splitByDay', () => {
	it('keeps a short watch on one day', () => {
		expect(splitByDay(at('2026-11-10T10:00:00'), at('2026-11-10T10:30:00'))).toEqual([
			{day: '2026-11-10', ms: 30 * 60_000, date: at('2026-11-10T10:30:00') - 1},
		]);
	});

	it('drops watches at or under 500 ms', () => {
		expect(splitByDay(1000, 1500)).toEqual([]);
		expect(splitByDay(1000, 1501)).toHaveLength(1);
	});

	it('splits on midnight', () => {
		const slices = splitByDay(at('2026-11-09T23:00:00'), at('2026-11-10T01:00:00'));
		expect(slices.map(s => [s.day, s.ms])).toEqual([['2026-11-10', 3_600_000], ['2026-11-09', 3_600_000]]);
		expect(dayKey(slices[1]?.date ?? 0)).toBe('2026-11-09');
	});

	it('splits across several days', () => {
		const slices = splitByDay(at('2026-11-07T12:00:00'), at('2026-11-10T06:00:00'));
		expect(slices.map(s => [s.day, s.ms / 3_600_000])).toEqual([
			['2026-11-10', 6], ['2026-11-09', 24], ['2026-11-08', 24], ['2026-11-07', 12],
		]);
	});

	it('uses real local midnights across a DST change', () => {
		// 2026-10-25 lasts 25 hours in Europe/Paris.
		const slices = splitByDay(at('2026-10-24T23:00:00'), at('2026-10-26T01:00:00'));
		expect(slices.map(s => [s.day, s.ms / 3_600_000])).toEqual([['2026-10-26', 1], ['2026-10-25', 25], ['2026-10-24', 1]]);
	});

	it('puts a stop exactly at midnight on the previous day', () => {
		expect(splitByDay(at('2026-11-09T23:00:00'), at('2026-11-10T00:00:00')).map(s => s.day)).toEqual(['2026-11-09']);
	});
});

describe('registerOpened', () => {
	const now = at('2026-11-10T12:00:00');

	it('counts a new video', () => {
		expect(registerOpened({}, 'abc', now)).toEqual({ids: {abc: now}, isNew: true});
	});

	it('ignores a video opened less than an hour ago', () => {
		expect(registerOpened({abc: now - 59 * 60_000}, 'abc', now).isNew).toBe(false);
	});

	it('counts again after an hour and prunes old IDs', () => {
		const result = registerOpened({abc: now - 61 * 60_000, old: now - 2 * 3_600_000}, 'abc', now);
		expect(result).toEqual({ids: {abc: now}, isNew: true});
	});
});

describe('summarize', () => {
	it('computes totals and averages', () => {
		expect(summarize([{count: 2, watchedMs: 50, openedMs: 100}, {count: 4, watchedMs: 300, openedMs: 100}])).toEqual({
			count: 6, watchedMs: 350, openedMs: 200, days: 2, avgWatchedMs: 175, avgOpenedMs: 100, avgCount: 3, avgRatio: 0.75,
		});
		expect(summarize([]).avgRatio).toBe(0);
	});
});

describe('weirdDays', () => {
	const day = (watchedMs: number, openedMs: number) => ({count: 1, watchedMs, openedMs});
	it('flags only a high watched time that was not dismissed', () => {
		const days: [string, ReturnType<typeof day>][] = [['2026-01-01', day(10, 0)], ['2026-01-02', day(0, 10)], ['2026-01-03', day(10, 0)], ['2026-01-04', day(5, 0)]];
		expect(weirdDays(days, 5, ['2026-01-03']).map(([d]) => d)).toEqual(['2026-01-01']);
	});
});
