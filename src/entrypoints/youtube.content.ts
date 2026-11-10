import {browser} from 'wxt/browser';
import {defineContentScript} from 'wxt/utils/define-content-script';
import {HOOK_SOURCE, type Message, toMessage} from '@/lib/messages';
import {YOUTUBE_MATCHES} from '@/lib/youtube';

const send = (message: Message) => {
	// The background may be restarting; a lost event is not worth an error in the page console.
	browser.runtime.sendMessage(message).catch(() => undefined);
};

export default defineContentScript({
	matches: YOUTUBE_MATCHES,
	runAt: 'document_start',
	allFrames: true,
	main() {
		window.addEventListener('message', (event: MessageEvent<unknown>) => {
			const data = event.data as {source?: unknown; event?: unknown} | null;
			if (event.source !== window || data?.source !== HOOK_SOURCE) {
				return;
			}
			const message = toMessage(data.event);
			if (message) {
				send(message);
			}
		});
		window.addEventListener('pagehide', () => {
			send({type: 'stop'});
		});
	},
});
