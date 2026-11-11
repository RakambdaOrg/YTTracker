import {browser} from 'wxt/browser';
import {defineBackground} from 'wxt/utils/define-background';
import {updateIcon} from '@/lib/icon';
import {toMessage} from '@/lib/messages';
import {items} from '@/lib/storage';
import {handleMessage, handleTabClosed, setup} from '@/lib/tracker';

export default defineBackground(() => {
	void setup();
	void items.paused.getValue().then(updateIcon);
	items.paused.watch(paused => void updateIcon(paused));

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
