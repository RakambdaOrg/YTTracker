export interface DayStats {
	count: number;
	watchedMs: number;
	openedMs: number;
}

export interface DaySlice {
	day: string;
	ms: number;
	/** Last millisecond of the slice, sent to the online server. */
	date: number;
}

export const OPENED_DEDUPE_MS = 60 * 60 * 1000;
export const MINIMUM_WATCH_MS = 500;
export const DEFAULT_WEIRD_THRESHOLD_MS = 48 * 60 * 60 * 1000;

export const emptyDay = (): DayStats => ({count: 0, watchedMs: 0, openedMs: 0});

export function addStats(a: DayStats, b: Partial<DayStats>): DayStats {
	return {
		count: a.count + (b.count ?? 0),
		watchedMs: a.watchedMs + (b.watchedMs ?? 0),
		openedMs: a.openedMs + (b.openedMs ?? 0),
	};
}

/** Local calendar day, as YYYY-MM-DD. */
export function dayKey(date: Date | number): string {
	const d = new Date(date);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dayToDate(day: string): Date {
	const [y, m, d] = day.split('-').map(Number);
	return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

/**
 * Splits a watched interval on local midnights, newest day first.
 * Returns nothing for intervals at or under the minimum watch time.
 */
export function splitByDay(startMs: number, endMs: number): DaySlice[] {
	if (endMs - startMs <= MINIMUM_WATCH_MS) {
		return [];
	}
	const slices: DaySlice[] = [];
	let end = endMs;
	while (end > startMs) {
		const midnight = new Date(end);
		midnight.setHours(0, 0, 0, 0);
		// An end exactly on midnight belongs to the previous day.
		if (midnight.getTime() === end) {
			midnight.setDate(midnight.getDate() - 1);
		}
		const start = Math.max(startMs, midnight.getTime());
		slices.push({day: dayKey(end - 1), ms: end - start, date: end - 1});
		end = start;
	}
	return slices;
}

/**
 * Drops video IDs counted more than an hour ago, then tells whether this video
 * should be counted as opened. Returns the updated map.
 */
export function registerOpened(ids: Record<string, number>, videoId: string, now: number): {ids: Record<string, number>; isNew: boolean} {
	const kept = Object.fromEntries(Object.entries(ids).filter(([, time]) => now - time <= OPENED_DEDUPE_MS));
	if (videoId in kept) {
		return {ids: kept, isNew: false};
	}
	return {ids: {...kept, [videoId]: now}, isNew: true};
}

export interface Summary extends DayStats {
	days: number;
	avgWatchedMs: number;
	avgOpenedMs: number;
	avgCount: number;
	/** Mean over days of watched / max(watched, opened). */
	avgRatio: number;
}

/** Totals and per-day averages over the given days (only days with data, like the old chart). */
export function summarize(days: DayStats[]): Summary {
	const total = days.reduce(addStats, emptyDay());
	const ratio = days.reduce((sum, d) => sum + d.watchedMs / Math.max(1, d.watchedMs, d.openedMs), 0);
	const n = Math.max(1, days.length);
	return {...total, days: days.length, avgWatchedMs: total.watchedMs / n, avgOpenedMs: total.openedMs / n, avgCount: total.count / n, avgRatio: ratio / n};
}
