import '@/assets/common.css';
import {byId, el} from '@/lib/dom';
import {formatDuration} from '@/lib/format';
import {addStats, weirdDays} from '@/lib/stats';
import {getAllDays, getDay, items, setDays} from '@/lib/storage';

const rows = byId('rows');
const threshold = await items.weirdThreshold.getValue();
byId('threshold').textContent = formatDuration(threshold);

function numberInput(label: string, value: number, max: number): HTMLInputElement {
	return el('input', {type: 'number', min: '0', max: String(max), value: String(value), required: true, ariaLabel: label, className: 'short'});
}

async function save(day: string, newMs: number): Promise<void> {
	const current = await getDay(day);
	const delta = Math.min(0, newMs - current.watchedMs);
	await setDays({[day]: {...current, watchedMs: current.watchedMs + delta}});
	await items.total.setValue(addStats(await items.total.getValue(), {watchedMs: delta}));
}

async function dismiss(day: string): Promise<void> {
	await items.dismissedWeirdDays.setValue([...await items.dismissedWeirdDays.getValue(), day]);
}

function row(day: string, ms: number): HTMLElement {
	const hours = numberInput('Hours', Math.floor(ms / 3_600_000), 9999);
	const minutes = numberInput('Minutes', Math.floor(ms / 60_000) % 60, 59);
	const seconds = numberInput('Seconds', Math.floor(ms / 1000) % 60, 59);
	const keep = el('button', {type: 'button'}, 'Mark as correct');
	const form = el('form', {className: 'row'},
		el('span', {}, `${day}, watched: ${formatDuration(ms)} →`),
		hours, 'h', minutes, 'm', seconds, 's',
		el('button', {type: 'submit', className: 'primary'}, 'Save'),
		keep);
	form.addEventListener('submit', event => {
		event.preventDefault();
		const newMs = ((hours.valueAsNumber * 60 + minutes.valueAsNumber) * 60 + seconds.valueAsNumber) * 1000;
		if (!Number.isFinite(newMs) || newMs > ms) {
			alert('You can only lower the value.');
			return;
		}
		void save(day, newMs).then(() => {
			form.replaceWith(el('p', {}, `${day}, watched: saved ${formatDuration(newMs)}`));
		});
	});
	keep.addEventListener('click', () => {
		void dismiss(day).then(() => {
			form.replaceWith(el('p', {}, `${day}, watched: kept ${formatDuration(ms)}, won't be flagged again`));
		});
	});
	return form;
}

const days = Object.entries(await getAllDays()).sort(([a], [b]) => b.localeCompare(a));
const found = weirdDays(days, threshold, await items.dismissedWeirdDays.getValue()).map(([day, stats]) => row(day, stats.watchedMs));
rows.append(...(found.length > 0 ? found : [el('p', {}, 'No day above the threshold.')]));
