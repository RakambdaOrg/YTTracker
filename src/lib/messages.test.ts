import {expect, it} from 'vitest';
import {toMessage} from './messages';

it('accepts valid hook events', () => {
	expect(toMessage({kind: 'opened', videoId: 'abc', durationSec: 12})).toEqual({type: 'opened', videoId: 'abc', durationSec: 12});
	expect(toMessage({kind: 'play', videoId: 'abc'})).toEqual({type: 'play', videoId: 'abc'});
	expect(toMessage({kind: 'play', videoId: 'abc', title: 'A video'})).toEqual({type: 'play', videoId: 'abc', title: 'A video'});
	expect(toMessage({kind: 'play', videoId: 'abc', title: 'x'.repeat(300)})).toMatchObject({title: 'x'.repeat(200)});
	expect(toMessage({kind: 'play', videoId: 'abc', title: 5})).toEqual({type: 'play', videoId: 'abc'});
	expect(toMessage({type: 'stop'})).toEqual({type: 'stop'});
});

it('rejects forged or broken events', () => {
	expect(toMessage(null)).toBeNull();
	expect(toMessage({kind: 'opened', videoId: 'abc', durationSec: -1})).toBeNull();
	expect(toMessage({kind: 'opened', videoId: 'abc', durationSec: Infinity})).toBeNull();
	expect(toMessage({kind: 'play', videoId: 'undefined'})).toBeNull();
	expect(toMessage({kind: 'play', videoId: 'x'.repeat(100)})).toBeNull();
	expect(toMessage({kind: 'reset'})).toBeNull();
});
