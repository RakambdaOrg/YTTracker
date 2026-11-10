import '@/assets/common.css';
import {browser} from 'wxt/browser';
import {fetchUsername, setUsername} from '@/lib/api';
import {byId} from '@/lib/dom';
import * as dropbox from '@/lib/dropbox';
import {applyImport, buildExport, parseImport} from '@/lib/migration';
import {addStats} from '@/lib/stats';
import {getAllDays, items, SCHEMA_VERSION, setDays} from '@/lib/storage';
import {takeoutCounts} from '@/lib/takeout';

const input = (id: string) => byId(id) as HTMLInputElement;

/** Runs a button action, reporting any failure instead of leaving it in the console. */
function action(id: string, run: () => Promise<void>, event = 'click'): void {
	byId(id).addEventListener(event, () => {
		run().catch((error: unknown) => {
			console.error(error);
			alert(`Failed: ${error instanceof Error ? error.message : String(error)}`);
		});
	});
}

const exportText = async () => JSON.stringify(await buildExport());

async function importText(text: string): Promise<void> {
	let entries;
	try {
		entries = parseImport(text);
	} catch {
		alert('This is not a YouTube Tracker export file.');
		return;
	}
	if (!confirm('This will delete all your current data and replace it with the data in the file.\nContinue?')) {
		return;
	}
	await applyImport(entries);
	location.reload();
}

const readFile = (id: string) => input(id).files?.[0]?.text();

action('exportFile', async () => {
	const url = URL.createObjectURL(new Blob([await exportText()], {type: 'application/json'}));
	Object.assign(document.createElement('a'), {href: url, download: 'YTTExport.json'}).click();
	setTimeout(() => {
		URL.revokeObjectURL(url);
	}, 60_000);
});

action('importFile', async () => {
	const text = await readFile('importFile');
	if (text !== undefined) {
		await importText(text);
	}
}, 'change');

action('exportDropbox', async () => {
	await dropbox.uploadExport(await exportText());
	alert('Exported to Dropbox');
});

action('importDropbox', async () => {
	const text = await dropbox.downloadLatestExport();
	if (text === null) {
		alert('No export found in Dropbox');
		return;
	}
	await importText(text);
});

action('dropboxDisconnect', async () => {
	await dropbox.disconnect();
	alert('Dropbox login forgotten');
});

action('importTakeout', async () => {
	const text = await readFile('importTakeout');
	if (text === undefined) {
		return;
	}
	let history: unknown;
	try {
		history = JSON.parse(text);
	} catch {
		alert('This is not a valid JSON file.');
		return;
	}
	const existing = await getAllDays();
	const counts = takeoutCounts(history, new Set(Object.keys(existing)));
	const days = Object.keys(counts).length;
	const videos = Object.values(counts).reduce((a, b) => a + b, 0);
	if (days === 0) {
		alert('Nothing to import: every day in the file already has data.');
		return;
	}
	if (!confirm(`Found ${videos} videos over ${days} days with no data. Import them?`)) {
		return;
	}
	await setDays(Object.fromEntries(Object.entries(counts).map(([day, count]) => [day, {count, watchedMs: 0, openedMs: 0}])));
	await items.total.setValue(addStats(await items.total.getValue(), {count: videos}));
	alert('Done');
});

action('reset', async () => {
	if (!confirm('This will delete all your data!\nContinue?')) {
		return;
	}
	const userId = await items.userId.getValue();
	await browser.storage.local.clear();
	await browser.storage.local.set({userId, schemaVersion: SCHEMA_VERSION});
	location.reload();
});

const share = input('shareOnline');
share.checked = await items.shareOnline.getValue();
action('shareOnline', () => items.shareOnline.setValue(share.checked), 'change');

const debug = input('debug');
debug.checked = await items.debug.getValue();
debug.addEventListener('change', () => {
	// Must be called right in the user gesture, before any await.
	const permission = debug.checked ? browser.permissions.request({permissions: ['notifications']}) : Promise.resolve(false);
	void permission.catch(() => false).then(() => items.debug.setValue(debug.checked));
});

const username = input('username');
username.value = await items.username.getValue();
byId('usernameForm').addEventListener('submit', event => {
	event.preventDefault();
	setUsername(username.value)
		.then(() => items.username.setValue(username.value))
		.then(() => {
			alert('Username saved');
		})
		.catch(() => {
			alert('Failed to save the username');
		});
});

byId('userId').textContent = (await items.userId.getValue()) || 'Unknown';
byId('version').textContent = browser.runtime.getManifest().version;

// The server is the source of truth for the username, when it answers.
fetchUsername()
	.then(async name => {
		if (name !== null) {
			username.value = name;
			await items.username.setValue(name);
		}
	})
	.catch(() => {
		console.warn('Could not fetch the online username');
	});
