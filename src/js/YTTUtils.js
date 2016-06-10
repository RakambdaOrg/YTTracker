var YTT_DEBUG = false;
const YTT_CONFIG_IDS_WATCHED_KEY = 'YTT_IDS';
const YTT_CONFIG_START_TIME_KEY = 'YTT_Start';
const YTT_CONFIG_TOTAL_TIME_KEY = 'YTT_TotalTime';
const YTT_CONFIG_REAL_TIME_KEY = 'YTT_RealTime';
const YTT_CONFIG_DEBUG_KEY = 'YTT_Debug';
const YTT_MESSAGE_TYPE_KEY = 'type';
const YTT_MESSAGE_VALUE_KEY = 'value';
const YTT_LOG_EVENT = 'log';
const YTT_DURATION_EVENT = 'playerDuration';
const YTT_DURATION_EVENT_ID_KEY = 'ID';
const YTT_DURATION_EVENT_DURATION_KEY = 'duration';
const YTT_STATE_EVENT = 'playerStateChange';
const YTT_STATE_EVENT_ID_KEY = 'ID';
const YTT_STATE_EVENT_STATE_KEY = 'state';
const YTT_STATE_EVENT_TIME_KEY = 'time';
const YTT_DOM_PLAYER_STATE = 'YTTPlayerState';
const YTT_DOM_PLAYER_INFOS = 'YTTPlayerInfos';
const YTT_DOM_PLAYER_TIME_1 = 'YTTPlayerTime1';
const YTT_DOM_PLAYER_TIME_2 = 'YTTPlayerTime2';
const YTT_DOM_SPLITTER = '@';

function YTTSetDebug(state){
    YTTLog('Set debug to: ' + state);
    YTT_DEBUG = state;
}

/**
 * @return {number}
 */
function YTTGetDurationAsMillisec(d){
    if(!d) return 0;
    return (((((d.days || 0) * 24 + (d.hours || 0)) * 60 + (d.minutes || 0)) * 60 + (d.seconds || 0)) * 1000 + (d.milliseconds || 0)) || 0;
}

function YTTGetDurationAsMinutes(d){
    return parseInt(YTTGetDurationAsMillisec(d) / (60 * 1000));
}


function YTTGetValidDuration(d){
    if(!d) return {};
    if(YTTGetDurationAsMillisec(d) < 0) return {};
    return d;
}

function YTTAddDurations(d1, d2){
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
    d.seconds += (d1.seconds || 0) + (d2.seconds  || 0) + parseInt(d.milliseconds / 1000);
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
function YTTGetDurationString(duration){
    if(!duration)
        return '0S';
    duration = YTTAddDurations(duration, {});
    var text = '';
    if(duration.days)
        text += duration.days + 'D ';
    if(duration.hours)
        text += duration.hours + 'H ';
    if(duration.minutes)
        text += duration.minutes + 'M ';
    if(duration.seconds)
        text += duration.seconds + 'S';
    if(text == '')
        return '0S';
    return text;
}

/**
 * @return {string}
 */
function YTTGetDayConfigKey(now){
    now = now || new Date();
    return "day" + Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)) + now.getFullYear();
}

/**
 * @return {string}
 */
function YTTGetTotalDayConfigKey(now){
    return YTTGetDayConfigKey(now) + 'T';
}

/**
 * @return {string}
 */
function YTTGetRealDayConfigKey(now){
    return YTTGetDayConfigKey(now) + 'R';
}

/**
 * @return {string}
 */
function YTTGetDateString(time){
    if(!time)
        return '';
    var date = new Date(time);
    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}

/**
 * @return {number}
 */
function YTTCompareConfigDate(base, test){
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
    if(date.length > 4)
    {
        year = parseFloat(date.toString().substring(date.toString().length - 4));
        day = parseFloat(date.toString().substring(0, date.toString().length - 4));
    }
    else
    {
        year = parseFloat(date.toString());
    }
    return {year: year, day: day};
}

function YTTMessage(type, value){
    var message = {};
    message[YTT_MESSAGE_TYPE_KEY] = type;
    message[YTT_MESSAGE_VALUE_KEY] = value;
    try{
        chrome.runtime.sendMessage(message);
    }
    catch(err){
    }
}

function YTTLog(text){
    YTTMessage(YTT_LOG_EVENT, text);
}
