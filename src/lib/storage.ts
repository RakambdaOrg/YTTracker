import {storage} from 'wxt/utils/storage';
import {browser} from 'wxt/browser';
import {DEFAULT_WEIRD_THRESHOLD_MS, type DayStats, emptyDay} from './stats';

export const SCHEMA_VERSION = 2;
export const DAY_PREFIX = 'day:';

export interface PendingShare {
	type: 'opened' | 'watched';
	videoId: string;
	ms: number;
	date: number;
}

export interface ActivePlayer {
	videoId: string;
	startedAt: number;
	/** Shown in the popup; missing when the player gave none. */
	title?: string;
}

export const items = {
	schemaVersion: storage.defineItem<number>('local:schemaVersion', {fallback: 0}),
	userId: storage.defineItem<string>('local:userId', {fallback: ''}),
	// Secret sent with every write; the server locks userId to the first key it sees.
	userKey: storage.defineItem<string>('local:userKey', {fallback: ''}),
	// Set when the server refused userKey (another key owns userId), shown on the options page.
	keyRejected: storage.defineItem<boolean>('local:keyRejected', {fallback: false}),
	startTime: storage.defineItem<number | null>('local:startTime', {fallback: null}),
	total: storage.defineItem<DayStats>('local:total', {fallback: emptyDay()}),
	openedIds: storage.defineItem<Record<string, number>>('local:openedIds', {fallback: {}}),
	shareOnline: storage.defineItem<boolean>('local:shareOnline', {fallback: false}),
	failedShare: storage.defineItem<PendingShare[]>('local:failedShare', {fallback: []}),
	debug: storage.defineItem<boolean>('local:debug', {fallback: false}),
	// Set from the popup: while true, nothing is recorded.
	paused: storage.defineItem<boolean>('local:paused', {fallback: false}),
	weirdThreshold: storage.defineItem<number>('local:weirdThreshold', {fallback: DEFAULT_WEIRD_THRESHOLD_MS}),
	// Days the user marked as correct on the edit page, so they are not flagged again.
	dismissedWeirdDays: storage.defineItem<string[]>('local:dismissedWeirdDays', {fallback: []}),
	username: storage.defineItem<string>('local:username', {fallback: ''}),
	dropboxRefreshToken: storage.defineItem<string | null>('local:dropboxRefreshToken', {fallback: null}),
	dropboxAccess: storage.defineItem<{token: string; expiresAt: number} | null>('session:dropboxAccess', {fallback: null}),
	// Session storage survives service-worker restarts and is cleared with the browser.
	activePlayers: storage.defineItem<Record<string, ActivePlayer>>('session:activePlayers', {fallback: {}}),
};

/** A stored day, or null when nothing was recorded that day. */
export function findDay(day: string): Promise<DayStats | null> {
	return storage.getItem<DayStats>(`local:${DAY_PREFIX}${day}`);
}

export async function getDay(day: string): Promise<DayStats> {
	return (await findDay(day)) ?? emptyDay();
}

export async function getDays(days: string[]): Promise<Record<string, DayStats>> {
	const values = await storage.getItems(days.map(day => `local:${DAY_PREFIX}${day}` as const));
	return Object.fromEntries(days.map((day, i) => [day, (values[i]?.value as DayStats | null) ?? emptyDay()]));
}

export async function setDays(days: Record<string, DayStats>): Promise<void> {
	await storage.setItems(Object.entries(days).map(([day, value]) => ({key: `local:${DAY_PREFIX}${day}` as const, value})));
}

/** Every stored day, keyed by YYYY-MM-DD. */
export async function getAllDays(): Promise<Record<string, DayStats>> {
	const all = await browser.storage.local.get(null);
	return Object.fromEntries(Object.entries(all)
		.filter(([key]) => key.startsWith(DAY_PREFIX))
		.map(([key, value]) => [key.slice(DAY_PREFIX.length), value as DayStats]));
}
