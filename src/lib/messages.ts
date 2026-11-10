/** Events posted by the main-world hook to the isolated content script. */
export type HookEvent =
	| {kind: 'opened'; videoId: string; durationSec: number}
	| {kind: 'play'; videoId: string}
	| {kind: 'stop'};

/** Messages sent by content scripts to the background. */
export type Message =
	| {type: 'opened'; videoId: string; durationSec: number}
	| {type: 'play'; videoId: string}
	| {type: 'stop'};

export const HOOK_SOURCE = 'yttracker-hook';

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isVideoId = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length < 64 && value !== 'undefined';

/** Validates a page-posted event: the page can forge these. */
export function toMessage(value: unknown): Message | null {
	if (!isObject(value)) {
		return null;
	}
	switch (value.kind ?? value.type) {
		case 'opened':
			return isVideoId(value.videoId) && typeof value.durationSec === 'number' && Number.isFinite(value.durationSec) && value.durationSec >= 0
				? {type: 'opened', videoId: value.videoId, durationSec: value.durationSec}
				: null;
		case 'play':
			return isVideoId(value.videoId) ? {type: 'play', videoId: value.videoId} : null;
		case 'stop':
			return {type: 'stop'};
		default:
			return null;
	}
}
