function YTTGetConfig(values, callback) {
	const config = {};
	if (typeof values === 'string') {
		config[values] = safari.extension.settings.getItem(values);
	}
	else {
		for (const key in values) {
			if (values.hasOwnProperty(key)) {
				config[key] = safari.extension.settings.getItem(key);
			}
		}
	}
	callback(config);
}

function YTTDownload(value, name) {
	//TODO: Download on safari
}

function YTTSetConfig(config) {
	for (const key in config) {
		if (config.hasOwnProperty(key)) {
			safari.extension.settings.setItem(key, config[key]);
		}
	}
}

function YTTClearConfig(callback) {
	safari.extension.settings.clear();
	if (callback !== null)
		callback();
}

function YTTSendNotification(notification) {
	new Notification(notification['title'], {body: notification['message']});
}

function YTTMessage(type, value) {
	var message = {};
	message[YTT_MESSAGE_TYPE_KEY] = type;
	message[YTT_MESSAGE_VALUE_KEY] = value;
	try {
		safari.self.tab.dispatchMessage('YTTracker', message);
	}
	catch (err) {
	}
}

function YTTSetBadge(text) {
	safari.extension.toolbarItems.forEach(function(element){
		element.badge = text === '' ? 0 : 1;
	});
}

/**
 * @return {string}
 */
function YTTGetVersion()
{
	return safari.extension.displayVersion;
}

/**
 * @return {string}
 */
function YTTGetURL(path)
{
	return safari.extension.baseURI + path;
}

/**
 * @return {string}
 */
function YTTGetBrowser()
{
	return 'Safari';
}
