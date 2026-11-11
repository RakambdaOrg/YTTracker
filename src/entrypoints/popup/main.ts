import '@/assets/common.css';
import './popup.css';
import {browser} from 'wxt/browser';
import {byId, el, showStats} from '@/lib/dom';
import {formatDate, formatDuration} from '@/lib/format';
import {dayKey} from '@/lib/stats';
import {type ActivePlayer, findDay, items} from '@/lib/storage';

byId('openOptions').addEventListener('click', () => {
	void browser.runtime.openOptionsPage();
});

showStats('today', await findDay(dayKey(Date.now())));
showStats('total', await items.total.getValue());
byId('startDate').textContent = formatDate(await items.startTime.getValue());

/** Focuses the tab (and its window) a player is in. */
async function showTab(tabId: number): Promise<void> {
	const tab = await browser.tabs.update(tabId, {active: true});
	if (tab?.windowId !== undefined) {
		await browser.windows.update(tab.windowId, {focused: true});
	}
	window.close();
}

/** Lists the players counting watched time right now, the source of the "P" badge. */
function showPlaying(players: Record<string, ActivePlayer>): void {
	const entries = Object.entries(players).sort(([, a], [, b]) => a.startedAt - b.startedAt);
	byId('playingCard').hidden = entries.length === 0;
	byId('playing').replaceChildren(...entries.map(([player, {videoId, title, startedAt}]) => {
		const button = el('button', {type: 'button', title: 'Switch to this tab'}, `${title ?? `Video ${videoId}`} · ${formatDuration(Date.now() - startedAt)}`);
		button.addEventListener('click', () => {
			showTab(Number(player.split(':')[0])).catch(() => {
				alert('This tab is no longer open.');
			});
		});
		return el('li', {}, button);
	}));
}

showPlaying(await items.activePlayers.getValue());
items.activePlayers.watch(showPlaying);
