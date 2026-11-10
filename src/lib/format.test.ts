import {expect, it} from 'vitest';
import {formatDate, formatDuration} from './format';

it('formats durations', () => {
	expect(formatDuration(0)).toBe('0S');
	expect(formatDuration(((26 * 60 + 3) * 60 + 4) * 1000 + 5)).toBe('1D 2H 3M 4S');
	expect(formatDuration(1500, true)).toBe('1S 500MS');
});

it('formats the date without shifting the day', () => {
	expect(formatDate(new Date(2026, 10, 10, 23, 59).getTime())).toBe('2026-11-10');
	expect(formatDate(null)).toBe('');
});
