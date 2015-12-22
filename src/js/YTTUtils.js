var YTT_DEBUG = false;
var YTT_CONFIG_IDS_WATCHED_KEY = 'YTT_IDS';
var YTT_CONFIG_START_TIME_KEY = 'YTT_Start';
var YTT_CONFIG_TOTAL_TIME_KEY = 'YTT_TotalTime';
var YTT_CONFIG_REAL_TIME_KEY = 'YTT_RealTime';
var YTT_MESSAGE_TYPE_KEY = 'type';
var YTT_MESSAGE_VALUE_KEY = 'value';
var YTT_LOG_EVENT = 'log';
var YTT_DURATION_EVENT = 'playerDuration';
var YTT_DURATION_EVENT_ID_KEY = 'ID';
var YTT_DURATION_EVENT_DURATION_KEY = 'duration';
var YTT_STATE_EVENT = 'playerStateChange';
var YTT_STATE_EVENT_ID_KEY = 'ID';
var YTT_STATE_EVENT_STATE_KEY = 'state';
var YTT_STATE_EVENT_TIME_KEY = 'time';
var YTT_DOM_PLAYER_STATE = 'YTTPlayerState';
var YTT_DOM_PLAYER_INFOS = 'YTTPlayerInfos';
var YTT_DOM_PLAYER_TIME_1 = 'YTTPlayerTime1';
var YTT_DOM_PLAYER_TIME_2 = 'YTTPlayerTime2';
var YTT_DOM_SPLITTER = '@';

function YTTAddDurations(d1, d2){
    if(!d1)
        d1 = {};
    if(!d2)
        d2 = {};
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
    return text;
}

/**
 * @return {string}
 */
function YTTGetDayConfigKey(){
    var now = new Date();
    return "day" + Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)) + now.getFullYear();
}

/**
 * @return {string}
 */
function YTTGetTotalDayConfigKey(){
    return YTTGetDayConfigKey() + 'T';
}

/**
 * @return {string}
 */
function YTTGetRealDayConfigKey(){
    return YTTGetDayConfigKey() + 'R';
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

function YTTMessage(type, value){
    var message = {};
    message[YTT_MESSAGE_TYPE_KEY] = type;
    message[YTT_MESSAGE_VALUE_KEY] = value;
    chrome.runtime.sendMessage(message);
}

function YTTLog(text){
    YTTMessage(YTT_LOG_EVENT, text);
}
