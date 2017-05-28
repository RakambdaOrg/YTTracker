function YTTGetConfig(values, callback) {
	chrome.storage.sync.get(values, callback);
}

function YTTDownload(value, name) {
	chrome.downloads.download({
		url: value,
		filename: name
	});
}

function YTTSetConfig(config) {
	chrome.storage.sync.set(config);
}

function YTTClearConfig(callback) {
	chrome.storage.sync.clear(callback);
}

function YTTSendNotification(notification) {
	chrome.notifications.getPermissionLevel(function (permissionLevel) {
		if (permissionLevel === 'granted') {
			chrome.notifications.create('', notification);
		}
	});
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

/**
 * @return {string}
 */
function YTTGetVersion()
{
	return chrome.runtime.getManifest().version;
}

/**
 * @return {string}
 */
function YTTGetURL(path)
{
	return chrome.extension.getURL(path);
}

/**
 * @return {string}
 */
function YTTGetBrowser()
{
	return 'Chrome';
}
