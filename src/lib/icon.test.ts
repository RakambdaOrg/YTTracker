import {describe, expect, it} from 'vitest';
import {grayscale} from './icon';

describe('grayscale', () => {
	it('grays each pixel and keeps its alpha', () => {
		const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 0, 255, 255, 255, 128]);
		grayscale(pixels);
		expect([...pixels]).toEqual([76, 76, 76, 255, 29, 29, 29, 0, 255, 255, 255, 128]);
	});
});
