import {browser} from 'wxt/browser';
import {canShare, share} from './api';
import {formatDuration} from './format';
import {logDebug} from './log';
import type {Message} from './messages';
import {migrateStorage} from './migration';
import {createSerialQueue} from './serial';
import {addStats, dayKey, registerOpened, splitByDay} from './stats';
import {getDay, getDays, items, setDays} from './storage';

/** All storage updates go through this queue, so concurrent events never overwrite each other. */
const serial = createSerialQueue();

export function setup(): Promise<void> {
	return serial(async () => {
		await migrateStorage();
		if (!(await items.userId.getValue())) {
			await items.userId.setValue(crypto.randomUUID());
		}
	});
}

async function updateBadge(): Promise<void> {
	const playing = Object.keys(await items.activePlayers.getValue()).length > 0;
	await browser.action.setBadgeText({text: playing ? 'P' : ''});
}

async function onOpened(videoId: string, durationSec: number, now: number): Promise<void> {
	const {ids, isNew} = registerOpened(await items.openedIds.getValue(), videoId, now);
	await items.openedIds.setValue(ids);
	if (!isNew) {
		await logDebug('Video is not new', videoId);
		return;
	}
	const added = {count: 1, openedMs: Math.round(durationSec * 1000)};
	const today = dayKey(now);
	const total = addStats(await items.total.getValue(), added);
	await setDays({[today]: addStats(await getDay(today), added)});
	await items.total.setValue(total);
	if (!(await items.startTime.getValue())) {
		await items.startTime.setValue(now);
	}
	await logDebug('New total opened time:', formatDuration(total.openedMs, true));
	if (await canShare()) {
		void share([{type: 'opened', videoId, ms: added.openedMs, date: now}]);
	}
}

async function onPlay(player: string, videoId: string, title: string | undefined, now: number): Promise<void> {
	await items.activePlayers.setValue({...(await items.activePlayers.getValue()), [player]: {videoId, startedAt: now, ...(title ? {title} : {})}});
	await updateBadge();
	await logDebug('Started playing', player, videoId);
}

async function onStop(player: string, now: number): Promise<void> {
	const {[player]: active, ...others} = await items.activePlayers.getValue();
	if (!active) {
		return;
	}
	await items.activePlayers.setValue(others);
	await updateBadge();

	const slices = splitByDay(active.startedAt, now);
	if (slices.length === 0) {
		return;
	}
	const days = await getDays(slices.map(s => s.day));
	let total = await items.total.getValue();
	for (const slice of slices) {
		days[slice.day] = addStats(days[slice.day] ?? {count: 0, watchedMs: 0, openedMs: 0}, {watchedMs: slice.ms});
		total = addStats(total, {watchedMs: slice.ms});
		await logDebug(`Added watched time ${formatDuration(slice.ms, true)} to ${slice.day}`);
	}
	await setDays(days);
	await items.total.setValue(total);
	if (await canShare()) {
		void share(slices.map(s => ({type: 'watched', videoId: active.videoId, ms: s.ms, date: s.date})));
	}
}

/** Handles a validated message from the player identified by tab and frame. */
export function handleMessage(message: Message, player: string, now = Date.now()): Promise<void> {
	return serial(async () => {
		switch (message.type) {
			case 'opened':
				await onOpened(message.videoId, message.durationSec, now);
				break;
			case 'play':
				await onPlay(player, message.videoId, message.title, now);
				break;
			case 'stop':
				await onStop(player, now);
				break;
		}
	});
}

/** A closed tab cannot always send its stop event; finish its players here. */
export function handleTabClosed(tabId: number, now = Date.now()): Promise<void> {
	return serial(async () => {
		for (const player of Object.keys(await items.activePlayers.getValue())) {
			if (player.startsWith(`${tabId}:`)) {
				await onStop(player, now);
			}
		}
	});
}
