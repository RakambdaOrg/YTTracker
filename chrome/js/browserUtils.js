
/**
 * Get values from the configuration.
 *
 * @param values The values to get.
 * @param callback The callback to call.
 */
function YTTGetConfig(values, callback) {
	if (callback)
		chrome.storage.local.get(values, callback);
}

/**
 * Get values from the configuration.
 *
 * @param values The values to get.
 * @param callback The callback to call.
 */
function YTTGetSyncConfig(values, callback) {
	if (callback)
		chrome.storage.sync.get(values, callback);
}

/**
 * Start the download of a json file.
 *
 * @param json The json of the file.
 * @param name The default file name.
 */
function YTTDownload(json, name, callback = null) {
	const value = 'data:application/json;base64,' + btoa(JSON.stringify(json));
	chrome.downloads.download({
		url: value,
		filename: name
	}, function(downloadId) {
		chrome.downloads.onChanged.addListener(function (download) {
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
	chrome.storage.local.set(config, callback || function(){});
}

/**
 * Reset the configuration.
 *
 * @param callback The call back to call.
 */
function YTTClearConfig(callback = null) {
	chrome.storage.local.clear(callback || function(){});
}

/**
 * Reset the configuration.
 *
 * @param callback The call back to call.
 */
function YTTClearSyncConfig(callback = null) {
	chrome.storage.sync.clear(callback || function(){});
}

/**
 * Delete keys in the configuration.
 *
 * @param keys The keys to remove.
 */
function YTTRemoveConfig(keys, callback = null) {
	chrome.storage.local.remove(keys, callback || function(){});
}

/**
 * Send a notification to the client.
 *
 * @param notification The notification to send.
 */
function YTTSendNotification(notification) {
	chrome.notifications.getPermissionLevel(function (permissionLevel) {
		if (permissionLevel === 'granted') {
			chrome.notifications.create('', notification);
		}
	});
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
	} catch (err) {
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
 * Get the runtime url of a relative file.
 *
 * @return {string}
 */
function YTTGetRuntimeURL(path) {
	return chrome.runtime.getURL(path);
}

/**
 * Get the browser's name.
 *
 * @return {string}
 */
function YTTGetBrowser() {
	return 'Chrome';
}

/**
 * Open the options page of the extension if available.
 * @param onSuccess Callback called when opening settings.
 * @param onFail Callback if the settings can't be opened.
 */
function YTTOpenOptionsPage(onSuccess, onFail) {
	if (chrome.runtime.openOptionsPage) {
		chrome.runtime.openOptionsPage(onSuccess);
	} else if (onFail) {
		onFail();
	}
}

/**
 * Opens a new tab.
 * @param data The data of the tab to open.
 */
function YTTOpenTabURL(data) {
	chrome.tabs.create(data);
}

/**
 * Opens a new window.
 * @param data The data of the window to open.
 */
function YTTOpenWindowURL(data) {
	chrome.windows.create(data);
}
