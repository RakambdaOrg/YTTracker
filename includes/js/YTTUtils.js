/************************************* CONSTANTS *************************************/
const YTT_DATA_WATCHED = 'real';
const YTT_DATA_OPENED = 'total';
const YTT_DATA_COUNT = 'count';
const YTT_CONFIG_USERNAME = 'YTT_Username';
const YTT_CONFIG_SHARE_ONLINE = 'YTT_Share_Stats';
const YTT_CONFIG_USERID = 'YTT_User_ID';
const YTT_CONFIG_FAILED_SHARE = 'YTT_Failed_Share';
const YTT_CONFIG_VERSION = 'YTT_Version';
const YTT_CONFIG_IDS_WATCHED_KEY = 'YTT_IDS';
const YTT_CONFIG_START_TIME_KEY = 'YTT_Start';
const YTT_CONFIG_DROPBOX_ACCESS_TOKEN = 'YTT_Dropbox_Access_Token';
const YTT_CONFIG_ACTIVE_PLAYERS = 'YTT_Active_Players';
/**
 * @deprecated
 */
const YTT_CONFIG_TOTAL_TIME_KEY = 'YTT_TotalTime';
/**
 * @deprecated
 */
const YTT_CONFIG_REAL_TIME_KEY = 'YTT_RealTime';
const YTT_CONFIG_TOTAL_STATS_KEY = 'YTT_Total';
const YTT_CONFIG_DEBUG_KEY = 'YTT_Debug';
const YTT_CONFIG_WEIRD_DATA_THRESHOLD = 'YTT_Weird_Data_Threshold';
const YTT_MESSAGE_TYPE_KEY = 'type';
const YTT_MESSAGE_VALUE_KEY = 'value';
const YTT_LOG_EVENT = 'log';
const YTT_DURATION_EVENT = 'playerDuration';
const YTT_DURATION_EVENT_TABID_KEY = 'tabID';
const YTT_DURATION_EVENT_ID_KEY = 'ID';
const YTT_DURATION_EVENT_DURATION_KEY = 'duration';
const YTT_STATE_EVENT = 'playerStateChange';
const YTT_STATE_EVENT_ID_KEY = 'ID';
const YTT_STATE_EVENT_VID_KEY = 'videoID';
const YTT_STATE_EVENT_STATE_KEY = 'state';
const YTT_STATE_EVENT_STATE_KEY_PLAYING = 'opened';
const YTT_STATE_EVENT_STATE_KEY_WATCHED = 'watched';
const YTT_STATE_EVENT_TIME_KEY = 'time';
const YTT_DOWNLOAD_EVENT = 'download';
const YTT_DOWNLOAD_EVENT_DATA_KEY = 'downloadData';
const YTT_DOWNLOAD_EVENT_NAME_KEY = 'downloadName';
const YTT_DOWNLOAD_EVENT_CALLBACK_KEY = 'downloadCallback';
const YTT_DOM_PLAYER_STATE = 'YTTPlayerState';
const YTT_DOM_PLAYER_INFOS = 'YTTPlayerInfos';
const YTT_DOM_PLAYER_TIME_1 = 'YTTPlayerTime1';
const YTT_DOM_PLAYER_TIME_2 = 'YTTPlayerTime2';
const YTT_DOM_SPLITTER = '@';
const YTT_MS_PER_DAY = 86400 * 1000;
const YTT_MINIMUM_WATCH_THRESHOLD = 500; //0.5s


/************************************* OBJECTS *************************************/
/**
 * Creates a new YTTDay object. It represents the datas of a day.
 *
 * @param {int|YTTDay} count Initial video count, or object of YTTday.
 * @param {int} real Initial real time in ms.
 * @param {int} total Initial total time in ms.
 * @constructor
 */
function YTTDay(count = 0, real = 0, total = 0) {
	if (count && typeof count === 'object') {
		this[YTT_DATA_COUNT] = (count[YTT_DATA_COUNT] || 0);
		this[YTT_DATA_WATCHED] = new YTTDuration(count[YTT_DATA_WATCHED]);
		this[YTT_DATA_OPENED] = new YTTDuration(count[YTT_DATA_OPENED]);
	} else {
		this[YTT_DATA_COUNT] = count || 0;
		this[YTT_DATA_WATCHED] = new YTTDuration(YTT_DATA_WATCHED, real);
		this[YTT_DATA_OPENED] = new YTTDuration(YTT_DATA_OPENED, total);
	}
}

/**
 * Get the count of videos for this day.
 *
 * @returns {number} The count of videos.
 */
YTTDay.prototype.getCount = function () {
	return this[YTT_DATA_COUNT];
};
/**
 * Get the watched duration for this day.
 *
 * @returns {YTTDuration} The duration.
 */
YTTDay.prototype.getWatchedDuration = function () {
	return this[YTT_DATA_WATCHED];
};
/**
 * Get the opened duration for this day.
 *
 * @returns {YTTDuration} The duration.
 */
YTTDay.prototype.getOpenedDuration = function () {
	return this[YTT_DATA_OPENED];
};
/**
 * Add a duration to this day.
 *
 * @param {YTTDuration} duration The duration to add.
 */
YTTDay.prototype.addDuration = function (duration) {
	if (duration.type === YTT_DATA_WATCHED) {
		this[YTT_DATA_WATCHED] = this[YTT_DATA_WATCHED].addDuration(duration);
	} else if (duration.type === YTT_DATA_OPENED) {
		this[YTT_DATA_OPENED] = this[YTT_DATA_OPENED].addDuration(duration);
	}
};
/**
 * Add a video count to this day.
 *
 * @param {int} amount The number of videos to add.
 */
YTTDay.prototype.addCount = function (amount) {
	this[YTT_DATA_COUNT] = this[YTT_DATA_COUNT] + amount;
};

/**
 * @param {string|YTTDuration} type The type of the duration, or a YTTDuration object.
 * @param {int} milliseconds
 * @param {int} seconds
 * @param {int} minutes
 * @param {int} hours
 * @param {int} days
 * @constructor
 */
function YTTDuration(type, milliseconds = 0, seconds = 0, minutes = 0, hours = 0, days = 0) {
	if (type && typeof type === 'object') {
		this.milliseconds = (type.milliseconds || 0);
		this.seconds = (type.seconds || 0);
		this.minutes = (type.minutes || 0);
		this.hours = (type.hours || 0);
		this.days = (type.days || 0);
		this.type = type.type;
	} else {
		this.milliseconds = milliseconds;
		this.seconds = seconds;
		this.minutes = minutes;
		this.hours = hours;
		this.days = days;
		this.type = type;
	}
}

/**
 * Get the duration in milliseconds.
 *
 * @returns {number} The number of milliseconds.
 */
YTTDuration.prototype.getAsMilliseconds = function () {
	return (((((this.days || 0) * 24 + (this.hours || 0)) * 60 + (this.minutes || 0)) * 60 + (this.seconds || 0)) * 1000 + (this.milliseconds || 0)) || 0;
};
/**
 * Normalize the internal values.
 */
YTTDuration.prototype.normalize = function () {
	if (this.getAsMilliseconds() <= 0) {
		this.milliseconds = 0;
		this.seconds = 0;
		this.minutes = 0;
		this.hours = 0;
		this.days = 0;
		return;
	}
	this.addDuration(new YTTDuration(''));
};
/**
 * Add a duration to this one.
 *
 * @param {YTTDuration} duration The duration to add.
 */
YTTDuration.prototype.addDuration = function (duration) {
	this.milliseconds = this.milliseconds + duration.milliseconds;
	this.seconds = this.seconds + duration.seconds + Math.floor(this.milliseconds / 1000.0);
	this.milliseconds %= 1000;
	this.minutes = this.minutes + duration.minutes + Math.floor(this.seconds / 60.0);
	this.seconds %= 60;
	this.hours = this.hours + duration.hours + Math.floor(this.minutes / 60.0);
	this.minutes %= 60;
	this.days = this.days + duration.days + Math.floor(this.hours / 24.0);
	this.hours %= 24;
};
/**
 * Get this duration as a string.
 *
 * @param {boolean} showMillisec Show or not milliseconds.
 * @returns {string} The duration.
 */
YTTDuration.prototype.getAsString = function (showMillisec = false) {
	this.normalize();
	let text = '';
	if (this.days) {
		text += `${this.days}D `;
	}
	if (this.hours) {
		text += `${this.hours}H `;
	}
	if (this.minutes) {
		text += `${this.minutes}M `;
	}
	if (this.seconds) {
		text += `${this.seconds}S `;
	}
	if (showMillisec) {
		text += `${this.milliseconds}MS `;
	}
	if (text === '') {
		return '0S';
	}
	return text;
};

/**
 * Tell if the year is a leap year.
 *
 * @returns {boolean} True if lap year, false else.
 */
Date.prototype.isLeapYear = function () {
	const year = this.getFullYear();
	if ((year & 3) !== 0) {
		return false;
	}
	return ((year % 100) !== 0 || (year % 400) === 0);
};
/**
 * Get the number of the day in the year.
 *
 * @returns {int} The day number.
 */
Date.prototype.getDayOfYear = function () {
	const dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
	const mn = this.getMonth();
	const dn = this.getDate();
	let dayOfYear = dayCount[mn] + dn;
	if (mn > 1 && this.isLeapYear()) {
		dayOfYear++;
	}
	return dayOfYear;
};


/************************************* UTILITY FUNCTIONS *************************************/
/**
 * Generates a new UUID.
 *
 * @return {string}
 */
function YTTGenUUID() {
	const lut = [];
	for (let i = 0; i < 256; i++) {
		lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
	}
	const d0 = Math.random() * 0xffffffff | 0;
	const d1 = Math.random() * 0xffffffff | 0;
	const d2 = Math.random() * 0xffffffff | 0;
	const d3 = Math.random() * 0xffffffff | 0;
	return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
		lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
		lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
		lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
}

/**
 * Compare two versions.
 *
 * @param {string} v1 Base version.
 * @param {string} v2 The version to compare with.
 * @return {int} 1 if v1 is greater, -1 if lower, 0 if equals.
 */
function YTTCompareVersion(v1, v2) {
	if (v2 === undefined) {
		return 1;
	}
	const v1parts = v1.split(/[.-]/);
	const v2parts = v2.split(/[.-]/);

	function compareParts(v1parts, v2parts) {
		for (let i = 0; i < v1parts.length; ++i) {
			if (v2parts.length === i) {
				return 1;
			}

			let v1part = parseInt(v1parts[i]);
			let v2part = parseInt(v2parts[i]);
			const v1part_is_string = !(v1part === v1part);
			const v2part_is_string = !(v2part === v2part);
			v1part = v1part_is_string ? v1parts[i] : v1part;
			v2part = v2part_is_string ? v2parts[i] : v2part;

			if (v1part_is_string === v2part_is_string) {
				if (v1part_is_string === false) {
					if (v1part > v2part) {
						return 1;
					} else if (v1part < v2part) {
						return -1;
					}
				} else {
					const v1subparts = v1part.match(/[a-zA-Z]+|[0-9]+/g);
					const v2subparts = v2part.match(/[a-zA-Z]+|[0-9]+/g);
					if ((v1subparts.length === 1) && (v2subparts.length === 1)) {
						v1part = v1subparts[0];
						v2part = v2subparts[0];
						if (v1part === v2part) {
							continue;
						} else if (v1part > v2part) {
							return 1;
						} else {
							return -1;
						}
					}
					const result = compareParts(v1subparts, v2subparts);
					if (result !== 0) {
						return result;
					}
				}
			} else {
				return v2part_is_string ? 1 : -1;
			}
		}
		if (v1parts.length !== v2parts.length) {
			return -1;
		}
		return 0;
	}

	return compareParts(v1parts, v2parts);
}

/**
 * Get the config key for a date.
 *
 * @param {Date} now The date to get the key for.
 * @return {string} The config key.
 */
function YTTGetDayConfigKey(now = null) {
	now = now || new Date();
	return `day${now.getDayOfYear()}${now.getFullYear()}`;
}

/**
 * Get a timestamp as a date string.
 *
 * @param {number} time The timestamp.
 * @return {string} The date as YYY-MM-DD.
 */
function YTTGetDateString(time) {
	if (!time) {
		return '';
	}
	const date = new Date(time);
	const y = date.getFullYear();
	const m = `0${date.getMonth() + 1}`.slice(-2);
	const d = `0${date.getDate() + 1}`.slice(-2);
	return `${y}-${m}-${d}`;
}

/**
 * Transforms a date from the config into a date object.
 *
 * @param {string} str The date string as DDDYYYY
 * @returns {Date} A date object for the given date string.
 */
function YTTGetDateFromDay(str) {
	const year = parseFloat(str.substring(str.length - 4));
	const day = parseFloat(str.substring(0, str.length - 4));
	const date = new Date(year, 0);
	date.setDate(day);
	return date;
}

/**
 * Compares two config dates.
 *
 * @param {string} base The base date as DYYYY or DDYYYY or DDDYYYY.
 * @param {string} test The date to compare with as DYYYY or DDYYYY or DDDYYYY.
 * @return {number} The number of difference days, negative if base if before test.
 */
function YTTCompareConfigDate(base, test) {
	const baseObj = YTTConvertConfigDateToObject(base);
	const testObj = YTTConvertConfigDateToObject(test);
	return testObj.year !== baseObj.year ? (testObj.year - baseObj.year) * 365 : testObj.day - baseObj.day;
}

/**
 * Convert a config date (DYYYY or DDYYYY or DDDYYYY) into an object containing the year and the day number.
 *
 * @returns {{year: number, day: number}}
 */
function YTTConvertConfigDateToObject(date) {
	let year;
	let day = 0;
	if (date.length > 4) {
		year = parseFloat(date.toString().substring(date.toString().length - 4));
		day = parseFloat(date.toString().substring(0, date.toString().length - 4));
	} else {
		year = parseFloat(date.toString());
	}
	return {year: year, day: day};
}

/**
 * Send a message to log.
 *
 * @param {string} text The message to log.
 */
function YTTLog(text) {
	YTTMessage(YTT_LOG_EVENT, text);
}

/**
 * Add a value in an array in the config.
 * @param {string} key The key of the value.
 * @param {Array.<*>} valueToAdd The value to add.
 * @return {Promise<void>}
 */
function YTTConfigAddInArray(key, valueToAdd) {
	return YTTGetConfig(key).then(conf => {
		if (!conf[key]) {
			conf[key] = [];
		}
		conf[key] = conf[key].concat(valueToAdd);
		return YTTSetConfig(conf);
	});
}

/**
 * Get the configuration for an export. Sensitive data will be stripped out.
 * @returns {Promise<Object>} A promise containing the config.
 */
function YTTGetConfigForExport() {
	return YTTGetConfig().then(config => {
		if (YTT_CONFIG_DROPBOX_ACCESS_TOKEN in config) {
			delete config[YTT_CONFIG_DROPBOX_ACCESS_TOKEN];
		}
		return config;
	});
}

/**
 * Get a web auth flow to connect to OAuth2 services.
 * @param {chrome.identity.WebAuthFlowOptions} details The details of the flow.
 * @returns {Promise<string>} A promise with the result URL (callback).
 */
function YTTLaunchWebAuthFlow(details) {
	if (typeof browser === 'undefined') {
		return new Promise(resolve => {
			chrome.identity.launchWebAuthFlow(details, resolve);
		});
	}
	return browser.identity.launchWebAuthFlow(details);
}

/**
 * Get an URL for redirections when using OAuth2.
 * @param {string?} path
 * @returns {string} The URL to redirect to.
 */
function YTTGetRedirectURL(path) {
	if (typeof browser === 'undefined') {
		return chrome.identity.getRedirectURL(path);
	}
	return browser.identity.getRedirectURL(path);
}

/**
 * Opens a new window.
 * @param {chrome.windows.CreateData} data The data of the window to open.
 * @return {Promise<chrome.windows.Window|browser.windows.Window|undefined>}
 */
function YTTOpenWindowURL(data) {
	if (typeof browser === 'undefined') {
		return new Promise(resolve => chrome.windows.create(data, resolve));
	}
	return browser.windows.create(data);
}

/**
 * Set the configuration.
 *
 * @param {Object} config The configuration to set.
 * @return {Promise<void>}
 */
function YTTSetConfig(config) {
	if (typeof browser === 'undefined') {
		return new Promise(resolve => chrome.storage.local.set(config, resolve));
	}
	return browser.storage.local.set(config);
}

/**
 * Opens a new tab.
 * @param {object} data The data of the tab to open.
 * @return {Promise<chrome.tabs.Tab|browser.tabs.Tab>}
 */
function YTTOpenTabURL(data) {
	if (typeof browser === 'undefined') {
		return new Promise(resolve => chrome.tabs.create(data, resolve));
	}
	return browser.tabs.create(data);
}

/**
 * Open the options page of the extension if available.
 * @return {Promise<void>}
 */
function YTTOpenOptionsPage() {
	if (typeof browser === 'undefined') {
		return new Promise(resolve => chrome.runtime.openOptionsPage(resolve));
	}
	return browser.runtime.openOptionsPage();
}

/**
 * Get the browser's name.
 *
 * @return {string}
 */
function YTTGetBrowser() {
	return typeof browser === 'undefined' ? 'Chrome' : 'Firefox';
}

/**
 * Get the runtime url of a relative file.
 *
 * @param {string} path
 * @return {string}
 */
function YTTGetRuntimeURL(path) {
	if (typeof browser === 'undefined') {
		return chrome.runtime.getURL(path);
	}
	return browser.runtime.getURL(path);
}

/**
 * Get the url of a relative file.
 *
 * @param {string} path
 * @return {string}
 */
function YTTGetURL(path) {
	if (typeof browser === 'undefined') {
		return chrome.extension.getURL(path);
	}
	return browser.extension.getURL(path);
}

/**
 * Get the version of the extension.
 *
 * @return {string}
 */
function YTTGetVersion() {
	if (typeof browser === 'undefined') {
		return chrome.runtime.getManifest().version;
	}
	return browser.runtime.getManifest().version;
}

/**
 * Set the text on the badge of the app icon.
 *
 * @param {string} text The text to set.
 */
function YTTSetBadge(text) {
	if (typeof browser === 'undefined') {
		chrome.action.setBadgeText({text: text});
	} else {
		browser.browserAction.setBadgeText({text: text});
	}
}

/**
 * Send a message to the background page.
 *
 * @param {string} type The type of the message.
 * @param {*} value Its value.
 */
function YTTMessage(type, value) {
	let message = {};
	message[YTT_MESSAGE_TYPE_KEY] = type;
	message[YTT_MESSAGE_VALUE_KEY] = value;
	if (typeof browser === 'undefined') {
		chrome.runtime.sendMessage(message);
	} else {
		browser.runtime.sendMessage(message);
	}
}

/**
 * Send a notification to the client.
 *
 * @param {chrome.notifications.NotificationOptions|browser.notifications.CreateNotificationOptions} notification The notification to send.
 * @return {Promise<string|undefined>}
 */
function YTTSendNotification(notification) {
	if (typeof browser === 'undefined') {
		return new Promise((resolve, reject) => chrome.notifications.getPermissionLevel(function (permissionLevel) {
			if (permissionLevel === 'granted') {
				chrome.notifications.create('', notification, resolve);
			} else {
				reject(`Permission is ${permissionLevel}`);
			}
		}));
	}
	browser.notifications.create(notification);
}

/**
 * Reset the configuration.
 *
 * @return {Promise<void>}
 */
function YTTClearConfig() {
	if (typeof browser === 'undefined') {
		return new Promise(resolve => chrome.storage.local.clear(resolve));
	}
	return browser.storage.local.clear();
}

/**
 * Delete keys in the configuration.
 *
 * @param {string|string[]} keys The keys to remove.
 * @return {Promise<void>}
 */
function YTTRemoveConfig(keys) {
	if (typeof browser === 'undefined') {
		return new Promise(resolve => chrome.storage.local.remove(keys, resolve));
	}
	return browser.storage.local.remove(keys);
}

/**
 *
 * @param {chrome.downloads.DownloadOptions|browser.downloads.DownloadQuery} options
 * @return {Promise<number|undefined>}
 */
function YTTDownload(options) {
	if (typeof browser === 'undefined') {
		return new Promise(resolve => chrome.downloads.download(options, resolve));
	}
	return browser.downloads.download(options);
}

/**
 * Start the download of a file.
 *
 * @param {Object} obj The json of the json file.
 * @param {string} name The default file name.
 * @return {Promise<chrome.downloads.DownloadDelta>}
 */
function YTTDownloadObject(obj, name) {
	const jsonStr = JSON.stringify(obj);
	const blob = new Blob([jsonStr], {type: 'application/json'});
	const value = URL.createObjectURL(blob);
	return YTTDownload({
		url: value,
		filename: name,
		saveAs: true
	}).then(downloadId => {
		return new Promise(resolve => (typeof browser === 'undefined' ? chrome : browser).downloads.onChanged.addListener(download => {
			if (download.id === downloadId && (download.state && (download.state.current === 'interrupted' || download.state.current === 'complete'))) {
				URL.revokeObjectURL(value);
				resolve(download);
			}
		}));
	});
}

/**
 * Get values from the configuration.
 *
 * @param {(string|string[])?} values The values to get.
 * @return {Promise<{[p: string]: any}>}
 */
function YTTGetConfig(values) {
	if (typeof browser === 'undefined') {
		return new Promise(resolve => chrome.storage.local.get(values, resolve));
	}
	return browser.storage.local.get(values);
}

function YTTImportConfig(data) {
	let dataObject;
	try {
		dataObject = JSON.parse(data);
	} catch (err) {
		alert('Corrupted file!');
		return;
	}
	if (!confirm('This action will reset all your current data and replace it with the one in the file!\nAre you sure to continue?')) {
		return;
	}
	YTTSetConfig(dataObject).then(() => location.reload());
}
