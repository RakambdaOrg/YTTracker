/************************************* CONSTANTS *************************************/
const YTT_DATA_REAL = 'real';
const YTT_DATA_TOTAL = 'total';
const YTT_DATA_COUNT = 'count';
const YTT_CONFIG_USERNAME = 'YTT_Username';
const YTT_CONFIG_SHARE_ONLINE = 'YTT_Share_Stats';
const YTT_CONFIG_USERID = 'YTT_User_ID';
const YTT_CONFIG_FAILED_SHARE = 'YTT_Failed_Share';
const YTT_CONFIG_VERSION = 'YTT_Version';
const YTT_CONFIG_IDS_WATCHED_KEY = 'YTT_IDS';
const YTT_CONFIG_START_TIME_KEY = 'YTT_Start';
const YTT_CONFIG_TOTAL_TIME_KEY = 'YTT_TotalTime';
const YTT_CONFIG_REAL_TIME_KEY = 'YTT_RealTime';
const YTT_CONFIG_DEBUG_KEY = 'YTT_Debug';
const YTT_CONFIG_THEME = 'YTTTheme';
const YTT_CONFIG_HANDDRAWN = 'YTTHanddrawn';
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
const YTT_STATE_EVENT_TIME_KEY = 'time';
const YTT_DOM_PLAYER_STATE = 'YTTPlayerState';
const YTT_DOM_PLAYER_INFOS = 'YTTPlayerInfos';
const YTT_DOM_PLAYER_TIME_1 = 'YTTPlayerTime1';
const YTT_DOM_PLAYER_TIME_2 = 'YTTPlayerTime2';
const YTT_DOM_SPLITTER = '@';


/************************************* OBJECTS *************************************/
/**
 * Creates a new YTTDay object. It represents the datas of a day.
 *
 * @param {int} count Initial video count.
 * @param {int} real Initial real time in ms.
 * @param {int} total Initial total time in ms.
 * @constructor
 */
function YTTDay(count = 0, real = 0, total = 0) {
	this[YTT_DATA_COUNT] = count;
	this[YTT_DATA_REAL] = new YTTDuration(YTT_DATA_REAL, real);
	this[YTT_DATA_TOTAL] = new YTTDuration(YTT_DATA_TOTAL, total);
}
/**
 * Get the count of videos for this day.
 *
 * @returns {YTTDuration} The count of videos.
 */
YTTDay.prototype.getCount = function () {
	return this[YTT_DATA_COUNT];
};
/**
 * Get the real duration for this day.
 *
 * @returns {YTTDuration} The duration.
 */
YTTDay.prototype.getRealDuration = function () {
	return this[YTT_DATA_REAL];
};
/**
 * Get the total duration for this day.
 *
 * @returns {YTTDuration} The duration.
 */
YTTDay.prototype.getTotalDuration = function () {
	return this[YTT_DATA_TOTAL];
};
/**
 * Add a duration to this day.
 *
 * @param {YTTDuration} duration The duration to add.
 */
YTTDay.prototype.addDuration = function (duration) {
	if (duration.type === YTT_DATA_REAL)
		this[YTT_DATA_REAL] = this[YTT_DATA_REAL].addDuration(duration);
	else if (duration.type === YTT_DATA_TOTAL)
		this[YTT_DATA_TOTAL] = this[YTT_DATA_TOTAL].addDuration(duration);
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
 * @param {string} type The type of the duration.
 * @param {int} milliseconds
 * @param {int} seconds
 * @param {int} minutes
 * @param {int} hours
 * @param {int} days
 * @constructor
 */
function YTTDuration(type, milliseconds = 0, seconds = 0, minutes = 0, hours = 0, days = 0) {
	this.milliseconds = milliseconds;
	this.seconds = seconds;
	this.minutes = minutes;
	this.hours = hours;
	this.days = days;
	this.type = type;
}

/**
 * Get the duration in milliseconds.
 *
 * @returns {number} The number of milliseconds.
 */
YTTDuration.prototype.getAsMilliseconds = function () {
	return (((((d.days || 0) * 24 + (d.hours || 0)) * 60 + (d.minutes || 0)) * 60 + (d.seconds || 0)) * 1000 + (d.milliseconds || 0)) || 0;
};
/**
 * Get the duration in hours.
 *
 * @returns {number} The number of hours.
 */
YTTDuration.prototype.getAsHours = function () {
	return this.getAsMilliseconds() / (60 * 60 * 1000);
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
	this.milliseconds += this.milliseconds + duration.milliseconds;
	this.seconds += this.seconds + duration.seconds + parseInt(this.milliseconds / 1000.0);
	this.milliseconds %= 1000;
	this.minutes = this.minutes + duration.minutes + parseInt(this.seconds / 60.0);
	this.seconds %= 60;
	this.hours = this.hours + duration.hours + parseInt(this.minutes / 60.0);
	this.minutes %= 60;
	this.days = this.days + duration.days + parseInt(this.hours / 24.0);
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
	if (this.days)
		text += this.days + 'D ';
	if (this.hours)
		text += this.hours + 'H ';
	if (this.minutes)
		text += this.minutes + 'M ';
	if (this.seconds)
		text += this.seconds + 'S ';
	if (showMillisec)
		text += this.milliseconds + 'MS';
	if (text === '')
		return '0S';
	return text;
};

/**
 * Tell if the year is a leap year.
 *
 * @returns {boolean} True if lap year, false else.
 */
Date.prototype.isLeapYear = function () {
	const year = this.getFullYear();
	if ((year & 3) !== 0) return false;
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
	if (mn > 1 && this.isLeapYear())
		dayOfYear++;
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
	for (let i = 0; i < 256; i++)
		lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
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
 * Add a number of videos watched to a day.
 *
 * @param {int} amount The number of videos to add.
 * @param {YTTDay} day The config day to modify.
 * @returns {YTTDay} The new day.
 */
function YTTAddConfigCount(amount, day) {
	if (!day)
		return new YTTDay(amount);
	day.addCount(amount);
	return day;
}

/**
 * Compare two versions.
 *
 * @param {string} v1 Base version.
 * @param {string} v2 The version to compare with.
 * @return {int} 1 if v1 is greater, -1 if lower, 0 if equals.
 */
function YTTCompareVersion(v1, v2) {
	if (v2 === undefined)
		return 1;
	const v1parts = v1.split(/[.-]/);
	const v2parts = v2.split(/[.-]/);

	function compareParts(v1parts, v2parts) {
		for (let i = 0; i < v1parts.length; ++i) {
			if (v2parts.length === i)
				return 1;

			let v1part = parseInt(v1parts[i]);
			let v2part = parseInt(v2parts[i]);
			const v1part_is_string = !(v1part === v1part);
			const v2part_is_string = !(v2part === v2part);
			v1part = v1part_is_string ? v1parts[i] : v1part;
			v2part = v2part_is_string ? v2parts[i] : v2part;

			if (v1part_is_string === v2part_is_string) {
				if (v1part_is_string === false) {
					if (v1part > v2part)
						return 1;
					else if (v1part < v2part)
						return -1;
				} else {
					const v1subparts = v1part.match(/[a-zA-Z]+|[0-9]+/g);
					const v2subparts = v2part.match(/[a-zA-Z]+|[0-9]+/g);
					if ((v1subparts.length === 1) && (v2subparts.length === 1)) {
						v1part = v1subparts[0];
						v2part = v2subparts[0];
						if (v1part === v2part)
							continue;
						else if (v1part > v2part)
							return 1;
						else
							return -1;
					}
					const result = compareParts(v1subparts, v2subparts);
					if (result !== 0)
						return result;
				}
			} else
				return v2part_is_string ? 1 : -1;
		}
		if (v1parts.length !== v2parts.length)
			return -1;
		return 0;
	}

	return compareParts(v1parts, v2parts, options);
}

/**
 * Add a duration into a YTTDay.
 *
 * @param {YTTDuration} duration The duration to add.
 * @param {YTTDay} day The day to add the duration to.
 * @returns {YTTDay} The new day.
 */
function YTTAddConfigDuration(duration, day) {
	if (!day)
		day = new YTTDay();
	day.addDuration(duration);
	return day;
}

/**
 * Change the theme of the current page.
 *
 * @param {string} theme The theme to set.
 */
function YTTApplyThemeCSS(theme) {
	let themeDOM = $('#YTTTheme');

	/**
	 * Apply the theme.
	 *
	 * @param {string} theme The name of the css file.
	 */
	function setTheme(theme) {
		if (themeDOM)
			themeDOM.remove();
		themeDOM = $('<link id="YTTTheme" rel="stylesheet" href="css/themes/' + theme + '.css">');
		themeDOM.appendTo('head');
	}

	switch (theme) {
		case 'light':
			setTheme('light');
			break;
		case 'dark':
		default:
			setTheme('dark');
	}
}

/**
 * Get the config key for a date.
 *
 * @param {Date} now The date to get the key for.
 * @return {string} The config key.
 */
function YTTGetDayConfigKey(now = null) {
	now = now || new Date();
	return 'day' + now.getDayOfYear() + now.getFullYear();
}

/**
 * Get a date as a string.
 *
 * @param {number} time The timestamp.
 * @return {string} The date as YYY-MM-DD.
 */
function YTTGetDateString(time) {
	if (!time)
		return '';
	const date = new Date(time);
	const y = date.getFullYear();
	const m = ('0' + (date.getMonth() + 1)).slice(-2);
	const d = ('0' + date.getDate()).slice(-2);
	return y + '-' + m + '-' + d;
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
	let year = 0;
	let day = 0;
	if (date.length > 4) {
		year = parseFloat(date.toString().substring(date.toString().length - 4));
		day = parseFloat(date.toString().substring(0, date.toString().length - 4));
	}
	else
		year = parseFloat(date.toString());
	return {year: year, day: day};
}

/**
 * Send a message to log.
 *
 * @param text The message to log.
 */
function YTTLog(text) {
	if(typeof YTTMessage !== 'undefined')
		YTTMessage(YTT_LOG_EVENT, text);
	else
		console.log(text);
}
