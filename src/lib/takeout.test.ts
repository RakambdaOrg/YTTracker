import {expect, it} from 'vitest';
import {takeoutCounts} from './takeout';

it('counts videos per day, skipping days with data and junk entries', () => {
	const history = [
		{time: '2026-11-08T10:00:00Z', titleUrl: 'https://www.youtube.com/watch?v=a'},
		{time: '2026-11-08T11:00:00Z', titleUrl: 'https://www.youtube.com/watch?v=b'},
		{time: '2026-11-09T11:00:00Z', titleUrl: 'https://www.youtube.com/watch?v=c'},
		{time: '2026-11-07T11:00:00Z', title: 'Removed video'},
		{time: 'not a date', titleUrl: 'x'},
		null,
	];
	expect(takeoutCounts(history, new Set(['2026-11-09']))).toEqual({'2026-11-08': 2});
	expect(takeoutCounts({}, new Set())).toEqual({});
});
