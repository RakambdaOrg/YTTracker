import {defineContentScript} from 'wxt/utils/define-content-script';
import {HOOK_SOURCE, type HookEvent} from '@/lib/messages';
import {YOUTUBE_MATCHES} from '@/lib/youtube';

/** The parts of YouTube's player API used here. */
interface YouTubePlayer extends HTMLElement {
	getVideoData(): {video_id?: string; title?: string};
	getDuration(): number;
	getPlayerState(): number;
	addEventListener(event: 'onStateChange', listener: (state: number) => void): void;
	addEventListener(event: 'onApiChange', listener: () => void): void;
}

// The player can appear long after load (e.g. landing on the homepage, then opening a video), so polling never stops.
const RETRY_DELAY_MS = 250;
const PLAYING = 1;
// Ended, paused, buffering.
const STOPPED = new Set([0, 2, 3]);

function isPlayer(element: HTMLElement | null): element is YouTubePlayer {
	const player = element as Partial<YouTubePlayer> | null;
	return typeof player?.getVideoData === 'function' && typeof player.getDuration === 'function' && typeof player.getPlayerState === 'function';
}

const post = (event: HookEvent) => {
	// Posted to this same window only; '*' also works in sandboxed embeds, whose origin is "null".
	window.postMessage({source: HOOK_SOURCE, event}, '*');
};

function hook(player: YouTubePlayer): void {
	let videoId = '';
	let opened = false;

	/** Sends "opened" once per video, as soon as its duration is known (or it plays, for live streams). */
	const open = (force: boolean) => {
		const durationSec = player.getDuration();
		if (videoId && !opened && (durationSec > 0 || force)) {
			opened = true;
			post({kind: 'opened', videoId, durationSec: Math.max(0, durationSec)});
		}
	};

	const onApiChange = () => {
		// During an ad the video data may describe the ad.
		if (player.classList.contains('ad-showing')) {
			return;
		}
		const id = player.getVideoData().video_id ?? '';
		if (id && id !== videoId) {
			// A new video in the same player: close the previous watch first.
			post({kind: 'stop'});
			videoId = id;
			opened = false;
		}
		open(false);
	};

	const onStateChange = (state: number) => {
		onApiChange();
		// Ads play in the same player; they must not count as watched time.
		if (state === PLAYING && videoId && !player.classList.contains('ad-showing')) {
			open(true);
			post({kind: 'play', videoId, title: player.getVideoData().title ?? ''});
		} else if (state === PLAYING || STOPPED.has(state)) {
			post({kind: 'stop'});
		}
	};

	onStateChange(player.getPlayerState());
	player.addEventListener('onStateChange', onStateChange);
	player.addEventListener('onApiChange', onApiChange);
}

export default defineContentScript({
	matches: YOUTUBE_MATCHES,
	runAt: 'document_start',
	allFrames: true,
	world: 'MAIN',
	main() {
		const timer = setInterval(() => {
			const player = document.getElementById('movie_player');
			if (isPlayer(player)) {
				clearInterval(timer);
				hook(player);
			}
		}, RETRY_DELAY_MS);
	},
});
