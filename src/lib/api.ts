import {formatDuration} from './format';
import {logDebug, notifyDebug} from './log';
import {items, type PendingShare} from './storage';
import {createSerialQueue} from './serial';

const API = 'https://yttracker.rakambda.fr/api/v2';
const serial = createSerialQueue();

const userUrl = async (path: string) => `${API}/${encodeURIComponent(await items.userId.getValue())}/${path}`;

/** Server date format, kept from the old extension: unpadded "Y-M-D H:m:s". */
function serverDate(time: number): string {
	const d = new Date(time);
	return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
}

async function send(share: PendingShare): Promise<boolean> {
	const details = `VideoID: ${share.videoId}\nDuration: ${formatDuration(share.ms, true)}\nDate: ${serverDate(share.date)}`;
	try {
		const response = await fetch(await userUrl('stats/add'), {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({type: share.type, stat: share.ms, date: serverDate(share.date)}),
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		await notifyDebug(`Sent ${share.type} time to server`, details);
		return true;
	} catch (error) {
		await logDebug('Failed to send to API', share, error);
		await notifyDebug(`Failed to send ${share.type} time to server`, details);
		return false;
	}
}

/** Sends new shares plus the ones that failed before; failures are kept for the next call. */
export function share(newShares: PendingShare[]): Promise<void> {
	return serial(async () => {
		const queue = [...(await items.failedShare.getValue()), ...newShares.filter(s => s.ms > 0)];
		await items.failedShare.setValue([]);
		const failed: PendingShare[] = [];
		for (const pending of queue) {
			if (!(await send(pending))) {
				failed.push(pending);
			}
		}
		if (failed.length > 0) {
			// Re-read: nothing else writes this key, but keep it additive anyway.
			await items.failedShare.setValue([...(await items.failedShare.getValue()), ...failed]);
		}
	});
}

export async function fetchUsername(): Promise<string | null> {
	const response = await fetch(await userUrl('username'));
	if (!response.ok) {
		return null;
	}
	const data = (await response.json()) as {code?: number; username?: unknown};
	return data.code === 200 && typeof data.username === 'string' ? data.username : null;
}

export async function setUsername(username: string): Promise<void> {
	const response = await fetch(await userUrl('username'), {method: 'POST', body: new URLSearchParams({username})});
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
}
