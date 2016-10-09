var YTT_DEBUG = true;
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
    var lut = [];
    for (var i = 0; i < 256; i++) {
        lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
    }
    var d0 = Math.random() * 0xffffffff | 0;
    var d1 = Math.random() * 0xffffffff | 0;
    var d2 = Math.random() * 0xffffffff | 0;
    var d3 = Math.random() * 0xffffffff | 0;
    return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
        lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
        lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
        lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
}

function YTTAddConfigCount(amount, config) {
    if (!config) {
        var newConf = {};
        newConf[YTT_DATA_COUNT] = amount;
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
    if(v2 === undefined){
        return 1;
    }
    var v1parts = v1.split(/[.-]/);
    var v2parts = v2.split(/[.-]/);

    function compareParts(v1parts, v2parts, options) {
        //noinspection JSUnresolvedVariable
        var zeroExtend = options && options.zeroExtend;

        if (zeroExtend) {
            while (v1parts.length < v2parts.length) v1parts.push("0");
            while (v2parts.length < v1parts.length) v2parts.push("0");
        }

        for (var i = 0; i < v1parts.length; ++i) {
            if (v2parts.length == i) {
                return 1;
            }

            var v1part = parseInt(v1parts[i]);
            var v2part = parseInt(v2parts[i]);
            var v1part_is_string = !(v1part == v1part);
            var v2part_is_string = !(v2part == v2part);
            v1part = v1part_is_string ? v1parts[i] : v1part;
            v2part = v2part_is_string ? v2parts[i] : v2part;

            if (v1part_is_string == v2part_is_string) {
                if (v1part_is_string == false) {
                    if (v1part == v2part) {
                    } else if (v1part > v2part) {
                        return 1;
                    } else {
                        return -1;
                    }
                } else {
                    var v1subparts = v1part.match(/[a-zA-Z]+|[0-9]+/g);
                    var v2subparts = v2part.match(/[a-zA-Z]+|[0-9]+/g);
                    if ((v1subparts.length == 1) && (v2subparts.length == 1)) {
                        v1part = v1subparts[0];
                        v2part = v2subparts[0];
                        if (v1part == v2part) {
                            continue;
                        } else if (v1part > v2part) {
                            return 1;
                        } else {
                            return -1;
                        }
                    }
                    var result = compareParts(v1subparts, v2subparts);
                    if (result == 0) {
                    } else {
                        return result;
                    }
                }
            } else {
                return v2part_is_string ? 1 : -1;
            }
        }

        if (v1parts.length != v2parts.length) {
            return -1;
        }

        return 0;
    }

    return compareParts(v1parts, v2parts, options);
}

function YTTAddConfigDuration(duration, config, key) {
    if (!config) {
        var newConf = {};
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
    var themeDOM = $('#YTTTheme');

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
    var year = this.getFullYear();
    if ((year & 3) != 0) return false;
    return ((year % 100) != 0 || (year % 400) == 0);
};

// Get Day of Year
Date.prototype.getDOY = function () {
    var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var mn = this.getMonth();
    var dn = this.getDate();
    var dayOfYear = dayCount[mn] + dn;
    if (mn > 1 && this.isLeapYear()) dayOfYear++;
    return dayOfYear;
};

function YTTSetDebug(state) {
    YTTLog('Set debug to: ' + state);
    YTT_DEBUG = state;
}

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
    if (!d) return {};
    if (YTTGetDurationAsMillisec(d) < 0) return {};
    if (d.days) {
        //noinspection JSDuplicatedDeclaration
        var temp = d.days - Math.floor(d.days);
        d.days = Math.floor(d.days);
        d.hours = (d.hours || 0) + temp * 24;
    }
    if (d.hours) {
        //noinspection JSDuplicatedDeclaration
        var temp = d.hours - Math.floor(d.hours);
        d.hours = Math.floor(d.hours);
        d.minutes = (d.minutes || 0) + temp * 60;
    }
    if (d.minutes) {
        //noinspection JSDuplicatedDeclaration
        var temp = d.minutes - Math.floor(d.minutes);
        d.minutes = Math.floor(d.minutes);
        d.secondes = (d.secondes || 0) + temp * 60;
    }
    if (d.secondes) {
        //noinspection JSDuplicatedDeclaration
        var temp = d.secondes - Math.floor(d.secondes);
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
    var d = {
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
function YTTGetDurationString(duration) {
    if (!duration)
        return '0S';
    duration = YTTAddDurations(duration, {});
    var text = '';
    if (duration.days)
        text += duration.days + 'D ';
    if (duration.hours)
        text += duration.hours + 'H ';
    if (duration.minutes)
        text += duration.minutes + 'M ';
    if (duration.seconds)
        text += duration.seconds + 'S';
    if (text == '')
        return '0S';
    return text;
}

/**
 * @return {string}
 */
function YTTGetDayConfigKey(now) {
    now = now || new Date();
    return "day" + now.getDOY() + now.getFullYear();
}

/**
 * @return {string}
 */
function YTTGetDateString(time) {
    if (!time)
        return '';
    var date = new Date(time);
    var y = date.getFullYear();
    var m = ("0" + (date.getMonth() + 1)).slice(-2);
    var d = ("0" + date.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
}

/**
 * @return {number}
 */
function YTTCompareConfigDate(base, test) {
    var baseObj = YTTConvertConfigDateToObject(base);
    var testObj = YTTConvertConfigDateToObject(test);
    return testObj.year != baseObj.year ? (testObj.year - baseObj.year) * 365 : testObj.day - baseObj.day;
}

/**
 * @returns {{year: number, day: number}}
 */
function YTTConvertConfigDateToObject(date) {
    var year = 0;
    var day = 0;
    if (date.length > 4) {
        year = parseFloat(date.toString().substring(date.toString().length - 4));
        day = parseFloat(date.toString().substring(0, date.toString().length - 4));
    }
    else {
        year = parseFloat(date.toString());
    }
    return {year: year, day: day};
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

function YTTLog(text) {
    YTTMessage(YTT_LOG_EVENT, text);
}
