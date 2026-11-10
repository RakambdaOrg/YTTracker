import {browser} from 'wxt/browser';
import {defineBackground} from 'wxt/utils/define-background';
import {toMessage} from '@/lib/messages';
import {handleMessage, handleTabClosed, setup} from '@/lib/tracker';

export default defineBackground(() => {
	void setup();

	browser.runtime.onMessage.addListener((raw, sender) => {
		const message = toMessage(raw);
		if (message && sender.tab?.id !== undefined) {
			void handleMessage(message, `${sender.tab.id}:${sender.frameId ?? 0}`);
		}
	});

	browser.tabs.onRemoved.addListener(tabId => {
		void handleTabClosed(tabId);
	});
});
