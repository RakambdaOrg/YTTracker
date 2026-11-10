import {formatDuration} from './format';
import type {DayStats} from './stats';

export function byId(id: string): HTMLElement {
	const element = document.getElementById(id);
	if (!element) {
		throw new Error(`Missing #${id}`);
	}
	return element;
}

/** Creates an element; children are text or elements, never HTML. */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
	const element = Object.assign(document.createElement(tag), props);
	element.append(...children);
	return element;
}

/** Fills the elements `${prefix}Watched`, `${prefix}Opened` and `${prefix}Count`. */
export function showStats(prefix: string, stats: DayStats | null): void {
	byId(`${prefix}Watched`).textContent = stats ? formatDuration(stats.watchedMs) : 'No data';
	byId(`${prefix}Opened`).textContent = stats ? formatDuration(stats.openedMs) : 'No data';
	byId(`${prefix}Count`).textContent = stats ? String(stats.count) : 'No data';
}
