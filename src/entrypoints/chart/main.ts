import '@/assets/common.css';
import {CategoryScale, Chart, Legend, LinearScale, LineController, LineElement, type Plugin, PointElement, Tooltip} from 'chart.js';
import {byId, el, showStats} from '@/lib/dom';
import {formatDuration} from '@/lib/format';
import {dayKey, type DayStats, summarize, type Summary, weirdDays} from '@/lib/stats';
import {getAllDays, items} from '@/lib/storage';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const HOUR = 3_600_000;
const css = getComputedStyle(document.documentElement);
const token = (name: string) => css.getPropertyValue(name).trim();

const days = Object.entries(await getAllDays()).sort(([a], [b]) => a.localeCompare(b));
const threshold = await items.weirdThreshold.getValue();

function fillSummary(target: HTMLElement, summary: Summary): void {
	const entries: [string, string][] = [
		['Watched', formatDuration(summary.watchedMs)],
		['Opened', formatDuration(summary.openedMs)],
		['Count', String(summary.count)],
		['Average watched', formatDuration(summary.avgWatchedMs)],
		['Average opened', formatDuration(summary.avgOpenedMs)],
		['Average count', summary.avgCount.toFixed(2)],
		['Average ratio', `${(100 * summary.avgRatio).toFixed(2)}%`],
	];
	target.replaceChildren(...entries.map(([label, value]) => el('div', {}, el('dt', {}, label), el('dd', {}, value))));
}

showStats('today', days.find(([day]) => day === dayKey(Date.now()))?.[1] ?? null);
fillSummary(byId('allStats'), summarize(days.map(([, stats]) => stats)));

const weird = weirdDays(days, threshold, await items.dismissedWeirdDays.getValue());
if (weird.length > 0) {
	byId('weirdCount').textContent = String(weird.length);
	byId('weirdThreshold').textContent = formatDuration(threshold);
	byId('weirdAlert').hidden = false;
}

// Vertical line under the cursor, on the day the tooltip shows.
const hoverLine: Plugin<'line'> = {
	id: 'hoverLine',
	afterDatasetsDraw: ({ctx, chartArea, tooltip}) => {
		const x = tooltip?.getActiveElements()[0]?.element.x;
		if (x === undefined) {
			return;
		}
		ctx.save();
		ctx.strokeStyle = token('--muted');
		ctx.beginPath();
		ctx.moveTo(x, chartArea.top);
		ctx.lineTo(x, chartArea.bottom);
		ctx.stroke();
		ctx.restore();
	},
};

const chart = new Chart<'line', number[], string>(byId('chart') as HTMLCanvasElement, {
	plugins: [hoverLine],
	type: 'line',
	data: {
		labels: [],
		datasets: [
			{label: 'Watched (h)', data: [], borderColor: token('--series-watched'), backgroundColor: token('--series-watched'), yAxisID: 'duration'},
			{label: 'Opened (h)', data: [], borderColor: token('--series-opened'), backgroundColor: token('--series-opened'), yAxisID: 'duration'},
			{label: 'Count', data: [], borderColor: token('--series-count'), backgroundColor: token('--series-count'), yAxisID: 'count'},
		],
	},
	options: {
		maintainAspectRatio: false,
		interaction: {mode: 'index', intersect: false},
		color: token('--text'),
		scales: {
			x: {ticks: {color: token('--muted')}, grid: {color: token('--border')}},
			duration: {position: 'left', min: 0, title: {display: true, text: 'Hours', color: token('--muted')}, ticks: {color: token('--muted')}, grid: {color: token('--border')}},
			count: {position: 'right', min: 0, title: {display: true, text: 'Count', color: token('--muted')}, ticks: {precision: 0, color: token('--muted')}, grid: {display: false}},
		},
		plugins: {
			tooltip: {
				callbacks: {
					label: item => (item.dataset.yAxisID === 'count' ? `Count: ${item.parsed.y}` : `${item.dataset.label?.replace(' (h)', '') ?? ''}: ${formatDuration((item.parsed.y ?? 0) * HOUR)}`),
				},
			},
		},
	},
});

function showPeriod(lastDays: number): void {
	const since = new Date();
	since.setDate(since.getDate() - lastDays);
	const inPeriod: [string, DayStats][] = lastDays > 0 ? days.filter(([day]) => day >= dayKey(since)) : days;
	byId('periodDays').textContent = String(inPeriod.length);
	fillSummary(byId('periodStats'), summarize(inPeriod.map(([, stats]) => stats)));
	chart.data.labels = inPeriod.map(([day]) => day);
	const [watched, opened, count] = chart.data.datasets;
	if (watched && opened && count) {
		watched.data = inPeriod.map(([, d]) => d.watchedMs / HOUR);
		opened.data = inPeriod.map(([, d]) => d.openedMs / HOUR);
		count.data = inPeriod.map(([, d]) => d.count);
	}
	chart.update();
}

const period = byId('period') as HTMLSelectElement;
period.addEventListener('change', () => {
	showPeriod(Number(period.value));
});
showPeriod(Number(period.value));
