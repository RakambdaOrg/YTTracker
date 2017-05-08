/*eslint no-unused-var:"off" */

function YTTGetConfig(values, callback) {
	browser.storage.sync.get(values).then(callback);
}

function YTTDownload(value, name) {
	//TODO: Download on firefox
}

function YTTSetConfig(config) {
	browser.storage.sync.set(config);
}

function YTTClearConfig(callback) {
	browser.storage.sync.clear();
	if (callback !== null)
		callback();
}

function YTTSendNotification(notification) {
	chrome.notifications.create('', notification);
}

function YTTMessage(type, value) {
	var message = {};
	message[YTT_MESSAGE_TYPE_KEY] = type;
	message[YTT_MESSAGE_VALUE_KEY] = value;
	try {
		chrome.runtime.sendMessage(message);
	}
	catch (err) {
	}
}

function YTTSetBadge(text) {
	chrome.browserAction.setBadgeText({text: text});
}
