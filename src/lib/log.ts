import {browser} from 'wxt/browser';
import {items} from './storage';

export async function logDebug(...data: unknown[]): Promise<void> {
	if (await items.debug.getValue()) {
		console.log('[YTTracker]', ...data);
	}
}

/** Shows a notification when debug is on and the optional permission was granted. */
export async function notifyDebug(title: string, message: string): Promise<void> {
	if (!(await items.debug.getValue()) || !(await browser.permissions.contains({permissions: ['notifications']}))) {
		return;
	}
	await browser.notifications.create({type: 'basic', iconUrl: browser.runtime.getURL('/assets/icon128.png'), title, message});
}
