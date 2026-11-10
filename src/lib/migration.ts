import {browser} from 'wxt/browser';
import {DAY_PREFIX, type PendingShare, SCHEMA_VERSION} from './storage';
import {addStats, dayKey, type DayStats, emptyDay} from './stats';

type Raw = Record<string, unknown>;

/** Keys of the old (v1) storage format. */
const LEGACY_DAY = /^day(\d{1,3})(\d{4})$/;
const LEGACY_KEYS = new Set([
	'YTT_User_ID', 'YTT_Start', 'YTT_IDS', 'YTT_Share_Stats', 'YTT_Failed_Share', 'YTT_Debug',
	'YTT_Weird_Data_Threshold', 'YTT_Username', 'YTT_Dropbox_Access_Token', 'YTT_Total', 'YTT_TotalTime',
	'YTT_RealTime', 'YTT_Active_Players', 'YTT_Version', 'YTTHanddrawn', 'YTTTheme',
]);

/** Keys an export or import may carry in the current format. */
const EXPORTED_KEYS = ['total', 'userId', 'startTime', 'openedIds', 'shareOnline', 'failedShare', 'debug', 'weirdThreshold', 'username'];

const isObject = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value);
const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0);

export const isLegacyKey = (key: string): boolean => LEGACY_KEYS.has(key) || LEGACY_DAY.test(key);

/** Old YTTDuration object {milliseconds, seconds, minutes, hours, days} to ms. */
export function legacyDurationMs(value: unknown): number {
	if (!isObject(value)) {
		return 0;
	}
	return num(value.milliseconds) + 1000 * (num(value.seconds) + 60 * (num(value.minutes) + 60 * (num(value.hours) + 24 * num(value.days))));
}

/** Old key "day<dayOfYear><YYYY>" to YYYY-MM-DD. */
export function legacyDayKey(key: string): string | null {
	const match = LEGACY_DAY.exec(key);
	if (!match) {
		return null;
	}
	return dayKey(new Date(Number(match[2]), 0, Number(match[1])));
}

function legacyDay(value: unknown): DayStats {
	if (!isObject(value)) {
		return emptyDay();
	}
	return {count: num(value.count), watchedMs: legacyDurationMs(value.real), openedMs: legacyDurationMs(value.total)};
}

function cleanDay(value: unknown): DayStats {
	if (!isObject(value)) {
		return emptyDay();
	}
	return {count: num(value.count), watchedMs: num(value.watchedMs), openedMs: num(value.openedMs)};
}

function cleanShares(value: unknown): PendingShare[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter(isObject).flatMap(share => {
		const type = share.type === 'opened' || share.type === 'watched' ? share.type : null;
		const videoId = typeof share.videoId === 'string' ? share.videoId : null;
		return type && videoId ? [{type, videoId, ms: num(share.ms), date: num(share.date)}] : [];
	});
}

function cleanIds(value: unknown): Record<string, number> {
	return isObject(value) ? Object.fromEntries(Object.entries(value).map(([id, time]) => [id, num(time)])) : {};
}

/** Converts a whole v1 storage dump (or v1 export file) to v2 storage entries. */
export function fromLegacy(old: Raw): Raw {
	const result: Raw = {};
	let daysTotal = emptyDay();
	for (const [key, value] of Object.entries(old)) {
		const day = legacyDayKey(key);
		if (day) {
			const stats = addStats(legacyDay(value), cleanDay(result[DAY_PREFIX + day]));
			result[DAY_PREFIX + day] = stats;
			daysTotal = addStats(daysTotal, legacyDay(value));
		}
	}

	// Same rule as the old setupExtension(): rebuild the total from the days when it is missing or the legacy totals exist.
	const rebuildTotal = !('YTT_Total' in old) || 'YTT_TotalTime' in old || 'YTT_RealTime' in old;
	result.total = rebuildTotal ? daysTotal : legacyDay(old.YTT_Total);

	if (typeof old.YTT_User_ID === 'string') {
		result.userId = old.YTT_User_ID;
	}
	if (num(old.YTT_Start)) {
		result.startTime = num(old.YTT_Start);
	}
	if (num(old.YTT_Weird_Data_Threshold)) {
		result.weirdThreshold = num(old.YTT_Weird_Data_Threshold);
	}
	if (typeof old.YTT_Username === 'string') {
		result.username = old.YTT_Username;
	}
	if (typeof old.YTT_Dropbox_Access_Token === 'string') {
		result.dropboxToken = old.YTT_Dropbox_Access_Token;
	}
	result.shareOnline = old.YTT_Share_Stats === true;
	result.debug = old.YTT_Debug === true;
	result.openedIds = cleanIds(old.YTT_IDS);
	result.failedShare = Array.isArray(old.YTT_Failed_Share)
		? old.YTT_Failed_Share.filter(isObject).flatMap(share => {
			const type = share.type === 'opened' || share.type === 'watched' ? share.type : null;
			const videoId = typeof share.videoID === 'string' ? share.videoID : null;
			return type && videoId ? [{type, videoId, ms: legacyDurationMs(share.duration), date: num(share.date) || Date.now()}] : [];
		})
		: [];
	return result;
}

/** Validates v2 data coming from an import file. Unknown keys are dropped. */
export function cleanCurrent(data: Raw): Raw {
	const result: Raw = {};
	for (const [key, value] of Object.entries(data)) {
		if (key.startsWith(DAY_PREFIX) && /^\d{4}-\d{2}-\d{2}$/.test(key.slice(DAY_PREFIX.length))) {
			result[key] = cleanDay(value);
		}
	}
	result.total = cleanDay(data.total);
	result.openedIds = cleanIds(data.openedIds);
	result.failedShare = cleanShares(data.failedShare);
	result.shareOnline = data.shareOnline === true;
	result.debug = data.debug === true;
	for (const key of ['userId', 'username'] as const) {
		if (typeof data[key] === 'string') {
			result[key] = data[key];
		}
	}
	for (const key of ['startTime', 'weirdThreshold'] as const) {
		if (num(data[key])) {
			result[key] = num(data[key]);
		}
	}
	return result;
}

/** Parses an export file of either format into v2 storage entries. Throws on invalid JSON. */
export function parseImport(text: string): Raw {
	const parsed: unknown = JSON.parse(text);
	if (!isObject(parsed)) {
		throw new Error('Not an export file');
	}
	if (parsed.version === SCHEMA_VERSION && isObject(parsed.data)) {
		return cleanCurrent(parsed.data);
	}
	if (Object.keys(parsed).some(isLegacyKey)) {
		return fromLegacy(parsed);
	}
	throw new Error('Not an export file');
}

export async function buildExport(): Promise<{version: number; data: Raw}> {
	const all = await browser.storage.local.get(null);
	const data = Object.fromEntries(Object.entries(all).filter(([key]) => key.startsWith(DAY_PREFIX) || EXPORTED_KEYS.includes(key)));
	return {version: SCHEMA_VERSION, data};
}

/** Replaces all stored data with the imported entries, keeping the current user ID when the file has none. */
export async function applyImport(entries: Raw): Promise<void> {
	const current = await browser.storage.local.get('userId');
	await browser.storage.local.clear();
	await browser.storage.local.set({...current, ...entries, schemaVersion: SCHEMA_VERSION});
}

/**
 * Moves v1 storage to v2. Runs on every background start, so the current case
 * is one small read. The schema version is written last: an interrupted run
 * converts again from the old keys, which overwrites rather than adds.
 */
export async function migrateStorage(): Promise<void> {
	const {schemaVersion} = await browser.storage.local.get('schemaVersion');
	if (num(schemaVersion) >= SCHEMA_VERSION) {
		return;
	}
	const all = await browser.storage.local.get(null);
	const legacyKeys = Object.keys(all).filter(isLegacyKey);
	if (legacyKeys.length > 0) {
		await browser.storage.local.set(fromLegacy(all));
		await browser.storage.local.remove(legacyKeys);
	}
	await browser.storage.local.set({schemaVersion: SCHEMA_VERSION});
}
