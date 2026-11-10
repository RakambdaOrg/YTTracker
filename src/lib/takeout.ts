import {dayKey} from './stats';

/**
 * Counts the videos per day in a Google Takeout watch history (watch-history.json),
 * skipping days that already have data: Takeout only gives a count, no durations.
 */
export function takeoutCounts(history: unknown, existingDays: Set<string>): Record<string, number> {
	const counts: Record<string, number> = {};
	if (!Array.isArray(history)) {
		return counts;
	}
	for (const entry of history as unknown[]) {
		const {time, titleUrl} = (entry ?? {}) as {time?: unknown; titleUrl?: unknown};
		if (typeof time !== 'string' || typeof titleUrl !== 'string') {
			continue;
		}
		const date = new Date(time);
		if (Number.isNaN(date.getTime())) {
			continue;
		}
		const day = dayKey(date);
		if (!existingDays.has(day)) {
			counts[day] = (counts[day] ?? 0) + 1;
		}
	}
	return counts;
}
