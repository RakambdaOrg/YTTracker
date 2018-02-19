/*eslint no-unused-var:"off" */

/**
 * Get values from the configuration.
 *
 * @param values The values to get.
 * @param callback The callback to call.
 */
function YTTGetConfig(values, callback) {
	browser.storage.sync.get(values).then(callback);
}

/**
 * Start the download of a file.
 *
 * @param value The url of the file.
 * @param name The default file name.
 */
function YTTDownload(value, name) {
	//TODO: Download on firefox
}

/**
 * Set the configuration.
 *
 * @param config The configuration to set.
 */
function YTTSetConfig(config) {
	browser.storage.sync.set(config);
}

/**
 * Reset the configuration.
 *
 * @param callback The call back to call.
 */
function YTTClearConfig(callback) {
	browser.storage.sync.clear();
	if (callback !== null)
		callback();
}

/**
 * Send a notification to the client.
 *
 * @param notification The notification to send.
 */
function YTTSendNotification(notification) {
	chrome.notifications.create('', notification);
}

/**
 * Send a message to the background page.
 *
 * @param type The type of the message.
 * @param value Its value.
 */
function YTTMessage(type, value) {
	let message = {};
	message[YTT_MESSAGE_TYPE_KEY] = type;
	message[YTT_MESSAGE_VALUE_KEY] = value;
	try {
		chrome.runtime.sendMessage(message);
	}
	catch (err) {
	}
}

/**
 * Set the text on the badge of the app icon.
 *
 * @param text The text to set.
 */
function YTTSetBadge(text) {
	chrome.browserAction.setBadgeText({text: text});
}

/**
 * Get the version of the extension.
 *
 * @return {string}
 */
function YTTGetVersion() {
	return chrome.runtime.getManifest().version;
}

/**
 * Get the url of a relative file.
 *
 * @return {string}
 */
function YTTGetURL(path) {
	return chrome.extension.getURL(path);
}

/**
 * Get the browser's name.
 *
 * @return {string}
 */
function YTTGetBrowser() {
	return 'Firefox';
}