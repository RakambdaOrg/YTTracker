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
 * @param json The json of the json file.
 * @param name The default file name.
 */
function YTTDownload(json, name, callback = null) {
	const jsonStr = JSON.stringify(json);
	const blob = new Blob([jsonStr], {type: "application/json"});
	const value  = URL.createObjectURL(blob);
	browser.downloads.download({
		url: value,
		filename: name
	}).then(function(downloadId) {
		browser.downloads.onChanged.addListener(function (download) {
			if(download.id === downloadId && (download.state == "interrupted" || download.state == "complete")){
				URL.revokeObjectURL(value);
				if (callback)
					callback(r);
			}
		});
	});
}

/**
 * Set the configuration.
 *
 * @param config The configuration to set.
 */
function YTTSetConfig(config, callback = null) {
	browser.storage.sync.set(config).then(callback);
}

/**
 * Delete keys in the configuration.
 *
 * @param keys The keys to remove.
 */
function YTTRemoveConfig(keys, callback = null) {
	browser.storage.sync.remove(keys).then(callback);
}

/**
 * Reset the configuration.
 *
 * @param callback The call back to call.
 */
function YTTClearConfig(callback = null) {
	browser.storage.sync.clear().then(callback);
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
		browser.runtime.openOptionsPage().then(onSuccess, onFail);
	} else if (onFail) {
		onFail();
	}
}
