import '@/assets/common.css';
import {byId, el} from '@/lib/dom';
import {formatDuration} from '@/lib/format';
import {addStats, type DayStats} from '@/lib/stats';
import {getAllDays, getDay, items, setDays} from '@/lib/storage';

type Field = 'watchedMs' | 'openedMs';
const LABELS: Record<Field, string> = {watchedMs: 'watched', openedMs: 'opened'};

const rows = byId('rows');
const threshold = await items.weirdThreshold.getValue();
byId('threshold').textContent = formatDuration(threshold);

function numberInput(label: string, value: number, max: number): HTMLInputElement {
	return el('input', {type: 'number', min: '0', max: String(max), value: String(value), required: true, ariaLabel: label, className: 'short'});
}

async function save(day: string, field: Field, newMs: number): Promise<void> {
	const current = await getDay(day);
	const delta = Math.min(0, newMs - current[field]);
	await setDays({[day]: {...current, [field]: current[field] + delta}});
	await items.total.setValue(addStats(await items.total.getValue(), {[field]: delta}));
}

function row(day: string, stats: DayStats, field: Field): HTMLElement {
	const ms = stats[field];
	const hours = numberInput('Hours', Math.floor(ms / 3_600_000), 9999);
	const minutes = numberInput('Minutes', Math.floor(ms / 60_000) % 60, 59);
	const seconds = numberInput('Seconds', Math.floor(ms / 1000) % 60, 59);
	const form = el('form', {className: 'row'},
		el('span', {}, `${day}, ${LABELS[field]}: ${formatDuration(ms)} →`),
		hours, 'h', minutes, 'm', seconds, 's',
		el('button', {type: 'submit', className: 'primary'}, 'Save'));
	form.addEventListener('submit', event => {
		event.preventDefault();
		const newMs = ((hours.valueAsNumber * 60 + minutes.valueAsNumber) * 60 + seconds.valueAsNumber) * 1000;
		if (!Number.isFinite(newMs) || newMs > ms) {
			alert('You can only lower the value.');
			return;
		}
		void save(day, field, newMs).then(() => {
			form.replaceWith(el('p', {}, `${day}, ${LABELS[field]}: saved ${formatDuration(newMs)}`));
		});
	});
	return form;
}

const days = Object.entries(await getAllDays()).sort(([a], [b]) => b.localeCompare(a));
const found = days.flatMap(([day, stats]) => (['watchedMs', 'openedMs'] as const)
	.filter(field => stats[field] > threshold)
	.map(field => row(day, stats, field)));
rows.append(...(found.length > 0 ? found : [el('p', {}, 'No day above the threshold.')]));
