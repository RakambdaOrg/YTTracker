/*eslint no-unused-var:"off" */

/**
 * Get values from the configuration.
 *
 * @param values The values to get.
 * @param callback The callback to call.
 */
function YTTGetConfig(values, callback) {
	if (callback)
		browser.storage.sync.get(values).then(callback);
}

/**
 * Start the download of a file.
 *
 * @param value The url of the file.
 * @param name The default file name.
 */
function YTTDownload(value, name, callback = null) {
	browser.downloads.download({
		url: value,
		filename: name
	}).then(r => {
		if (callback)
			callback(r);
	});
}

/**
 * Set the configuration.
 *
 * @param config The configuration to set.
 */
function YTTSetConfig(config, callback = null) {
	browser.storage.sync.set(config).then(r => {
		if (callback)
			callback(r);
	});
}

/**
 * Delete keys in the configuration.
 *
 * @param keys The keys to remove.
 */
function YTTRemoveConfig(keys, callback = null) {
	browser.storage.sync.remove(keys).then(r => {
		if (callback)
			callback(r);
	});
}

/**
 * Reset the configuration.
 *
 * @param callback The call back to call.
 */
function YTTClearConfig(callback = null) {
	browser.storage.sync.clear().then(r => {
		if (callback)
			callback(r);
	});
}

/**
 * Send a notification to the client.
 *
 * @param notification The notification to send.
 */
function YTTSendNotification(notification) {
	browser.notifications.create(notification);
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
		browser.runtime.sendMessage(message);
	} catch (err) {
	}
}

/**
 * Set the text on the badge of the app icon.
 *
 * @param text The text to set.
 */
function YTTSetBadge(text) {
	browser.browserAction.setBadgeText({text: text});
}

/**
 * Get the version of the extension.
 *
 * @return {string}
 */
function YTTGetVersion() {
	return browser.runtime.getManifest().version;
}

/**
 * Get the url of a relative file.
 *
 * @return {string}
 */
function YTTGetURL(path) {
	return browser.extension.getURL(path);
}

/**
 * Get the runtime url of a relative file.
 *
 * @return {string}
 */
function YTTGetRuntimeURL(path) {
	return browser.runtime.getURL(path);
}

/**
 * Get the browser's name.
 *
 * @return {string}
 */
function YTTGetBrowser() {
	return 'Firefox';
}

/**
 * Open the options page of the extension if available.
 * @param onSuccess Callback called when opening settings.
 * @param onFail Callback if the settings can't be opened.
 */
function YTTOpenOptionsPage(onSuccess, onFail) {
	if (browser.runtime.openOptionsPage) {
		browser.runtime.openOptionsPage().then(r => {
			if(onSuccess){
				onSuccess(r);
			}
		});
	} else if (onFail) {
		onFail();
	}
}
