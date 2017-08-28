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

/**
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

function YTTAddConfigCount(amount, config) {
	if (!config) {
		const newConf = {};
		newConf[YTT_DATA_COUNT] = 0;
		newConf[YTT_DATA_REAL] = {milliseconds: 0};
		newConf[YTT_DATA_TOTAL] = {milliseconds: 0};
		return newConf;
	}
	config[YTT_DATA_COUNT] = (config[YTT_DATA_COUNT] ? config[YTT_DATA_COUNT] : 0) + amount;
	return config;
}

/**
 * @return {number}
 */
function YTTCompareVersion(v1, v2, options) {
	if (v2 === undefined) {
		return 1;
	}
	const v1parts = v1.split(/[.-]/);
	const v2parts = v2.split(/[.-]/);

	function compareParts(v1parts, v2parts, options) {
		//noinspection JSUnresolvedVariable
		const zeroExtend = options && options.zeroExtend;

		if (zeroExtend) {
			while (v1parts.length < v2parts.length) v1parts.push('0');
			while (v2parts.length < v1parts.length) v2parts.push('0');
		}

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
					}
					else if (v1part < v2part) {
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

	return compareParts(v1parts, v2parts, options);
}

function YTTAddConfigDuration(duration, config, key) {
	if (!config) {
		const newConf = {};
		newConf[key] = duration;
		return newConf;
	}
	config[key] = YTTAddDurations(duration, config[key]);
	return config;
}

function YTTApplyThemeCSS(theme) {
	if (!theme) {
		theme = 'dark';
	}
	let themeDOM = $('#YTTTheme');

	function setTheme(theme) {
		if (themeDOM) {
			themeDOM.remove();
		}
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

Date.prototype.isLeapYear = function () {
	const year = this.getFullYear();
	if ((year & 3) !== 0) return false;
	return ((year % 100) !== 0 || (year % 400) === 0);
};

// Get Day of Year
Date.prototype.getDOY = function () {
	const dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
	const mn = this.getMonth();
	const dn = this.getDate();
	let dayOfYear = dayCount[mn] + dn;
	if (mn > 1 && this.isLeapYear()) dayOfYear++;
	return dayOfYear;
};

/**
 * @return {number}
 */
function YTTGetDurationAsMillisec(d) {
	if (!d) return 0;
	return (((((d.days || 0) * 24 + (d.hours || 0)) * 60 + (d.minutes || 0)) * 60 + (d.seconds || 0)) * 1000 + (d.milliseconds || 0)) || 0;
}

/**
 * @return {number}
 */
function YTTGetDurationAsHours(d) {
	return YTTGetDurationAsMillisec(d) / (60 * 60 * 1000);
}


function YTTGetValidDuration(d) {
	let temp;
	if (!d) return {};
	if (YTTGetDurationAsMillisec(d) <= 0) return {};
	if (d.days) {
		//noinspection JSDuplicatedDeclaration
		temp = d.days - Math.floor(d.days);
		d.days = Math.floor(d.days);
		d.hours = (d.hours || 0) + temp * 24;
	}
	if (d.hours) {
		//noinspection JSDuplicatedDeclaration
		temp = d.hours - Math.floor(d.hours);
		d.hours = Math.floor(d.hours);
		d.minutes = (d.minutes || 0) + temp * 60;
	}
	if (d.minutes) {
		//noinspection JSDuplicatedDeclaration
		temp = d.minutes - Math.floor(d.minutes);
		d.minutes = Math.floor(d.minutes);
		d.secondes = (d.secondes || 0) + temp * 60;
	}
	if (d.secondes) {
		//noinspection JSDuplicatedDeclaration
		temp = d.secondes - Math.floor(d.secondes);
		d.secondes = Math.floor(d.secondes);
		d.milliseconds = (d.milliseconds || 0) + temp * 1000;
	}
	if (d.milliseconds) {
		d.milliseconds = Math.floor(d.milliseconds);
	}
	return d;
}

function YTTAddDurations(d1, d2) {
	d1 = YTTGetValidDuration(d1);
	d2 = YTTGetValidDuration(d2);
	const d = {
		milliseconds: 0,
		seconds: 0,
		minutes: 0,
		hours: 0,
		days: 0
	};
	d.milliseconds += (d1.milliseconds || 0) + (d2.milliseconds || 0);
	d.seconds += (d1.seconds || 0) + (d2.seconds || 0) + parseInt(d.milliseconds / 1000);
	d.milliseconds %= 1000;
	d.minutes = (d1.minutes || 0) + (d2.minutes || 0) + parseInt(d.seconds / 60);
	d.seconds %= 60;
	d.hours = (d1.hours || 0) + (d2.hours || 0) + parseInt(d.minutes / 60);
	d.minutes %= 60;
	d.days = (d1.days || 0) + (d2.days || 0) + parseInt(d.hours / 24);
	d.hours %= 24;
	return d;
}

/**
 * @return {string}
 */
function YTTGetDurationString(duration, showMillisec) {
	if (!duration)
		return '0S';
	duration = YTTAddDurations(duration, {});
	let text = '';
	if (duration.days)
		text += duration.days + 'D ';
	if (duration.hours)
		text += duration.hours + 'H ';
	if (duration.minutes)
		text += duration.minutes + 'M ';
	if (duration.seconds)
		text += duration.seconds + 'S ';
	if (showMillisec)
		text += duration.milliseconds + 'MS';
	if (text === '')
		return '0S';
	return text;
}

/**
 * @return {string}
 */
function YTTGetDayConfigKey(now) {
	now = now || new Date();
	return 'day' + now.getDOY() + now.getFullYear();
}

/**
 * @return {string}
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
 * @return {number}
 */
function YTTCompareConfigDate(base, test) {
	const baseObj = YTTConvertConfigDateToObject(base);
	const testObj = YTTConvertConfigDateToObject(test);
	return testObj.year !== baseObj.year ? (testObj.year - baseObj.year) * 365 : testObj.day - baseObj.day;
}

/**
 * @returns {{year: number, day: number}}
 */
function YTTConvertConfigDateToObject(date) {
	let year = 0;
	let day = 0;
	if (date.length > 4) {
		year = parseFloat(date.toString().substring(date.toString().length - 4));
		day = parseFloat(date.toString().substring(0, date.toString().length - 4));
	}
	else {
		year = parseFloat(date.toString());
	}
	return {year: year, day: day};
}

function YTTLog(text) {
	YTTMessage(YTT_LOG_EVENT, text);
}
