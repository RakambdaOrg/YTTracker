'use strict';

var activePlayers = {};
var configVersion = {};
configVersion[YTT_CONFIG_VERSION] = chrome.app.getDetails().version;
chrome.storage.sync.set(configVersion);

function log(text) {
    if (YTT_DEBUG)
        console.log(text);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request[YTT_MESSAGE_TYPE_KEY] == YTT_LOG_EVENT) {
        log(request[YTT_MESSAGE_VALUE_KEY] || "undefined");
    }
    else if (request[YTT_MESSAGE_TYPE_KEY] == YTT_STATE_EVENT) {
        request[YTT_MESSAGE_VALUE_KEY][YTT_STATE_EVENT_ID_KEY] = sender.tab.id;
        playerStateChange(request[YTT_MESSAGE_VALUE_KEY]);
    }
    else if (request[YTT_MESSAGE_TYPE_KEY] == YTT_DURATION_EVENT)
        setVideoDuration(request[YTT_MESSAGE_VALUE_KEY])
});

function playerStateChange(event) {
    if (event[YTT_STATE_EVENT_STATE_KEY] == 1) {
        log("Started playing at " + event[YTT_STATE_EVENT_TIME_KEY] + "s");
        chrome.browserAction.setBadgeText({text: "P"});
        activePlayers[event[YTT_STATE_EVENT_ID_KEY]] = event[YTT_STATE_EVENT_TIME_KEY];
    }
    else if ((event[YTT_STATE_EVENT_STATE_KEY] == 2 || event[YTT_STATE_EVENT_STATE_KEY] == 0 || event[YTT_STATE_EVENT_STATE_KEY] == -5) && activePlayers[event[YTT_STATE_EVENT_ID_KEY]] != null) {
        log("Ended playing at " + event[YTT_STATE_EVENT_TIME_KEY] + "s");
        var REAL_TODAY_KEY = YTTGetRealDayConfigKey();
        var duration = {milliseconds: parseInt((event[YTT_STATE_EVENT_TIME_KEY] - activePlayers[event[YTT_STATE_EVENT_ID_KEY]]) * 1000)};
        activePlayers[event[YTT_STATE_EVENT_ID_KEY]] = null;
        var size = 0, key;
        for (key in activePlayers) if (activePlayers.hasOwnProperty(key) && activePlayers[key] != null) size++;
        if (size < 1)chrome.browserAction.setBadgeText({text: ""});
        chrome.storage.sync.get([YTT_CONFIG_REAL_TIME_KEY, REAL_TODAY_KEY], function (config) {
            var newConfig = {};
            newConfig[YTT_CONFIG_REAL_TIME_KEY] = YTTAddDurations(duration, config[YTT_CONFIG_REAL_TIME_KEY]);
            newConfig[REAL_TODAY_KEY] = YTTAddDurations(duration, config[REAL_TODAY_KEY]);
            chrome.storage.sync.set(newConfig);
            log("Added real time: " + YTTGetDurationString(duration));
        });
    }
}

function setVideoDuration(event) {
    var TOTAL_TODAY_KEY = YTTGetTotalDayConfigKey();
    var COUNT_TODAY_KEY = YTTGetCountDayConfigKey();
    chrome.storage.sync.get([YTT_CONFIG_IDS_WATCHED_KEY, YTT_CONFIG_START_TIME_KEY, YTT_CONFIG_TOTAL_TIME_KEY, TOTAL_TODAY_KEY, COUNT_TODAY_KEY], function (config) {
        var toRemove = [];
        var IDS = config[YTT_CONFIG_IDS_WATCHED_KEY] || {};
        for (var key in IDS) {
            if (IDS.hasOwnProperty(key)) {
                if (new Date().getTime() - IDS[key] > 60 * 60 * 1000) {
                    toRemove.push(key);
                }
            }
        }
        for (var key in toRemove) {
            log(key);
            delete IDS[toRemove[key]];
        }
        if (!IDS.hasOwnProperty(event[YTT_DURATION_EVENT_ID_KEY])) {
            IDS[event[YTT_DURATION_EVENT_ID_KEY]] = new Date().getTime();
            var duration = {milliseconds: parseInt(event[YTT_DURATION_EVENT_DURATION_KEY] * 1000)};
            var newConfig = {};
            newConfig[YTT_CONFIG_TOTAL_TIME_KEY] = YTTAddDurations(duration, config[YTT_CONFIG_TOTAL_TIME_KEY]);
            newConfig[YTT_CONFIG_IDS_WATCHED_KEY] = IDS;
            newConfig[YTT_CONFIG_START_TIME_KEY] = config[YTT_CONFIG_START_TIME_KEY] || new Date().getTime();
            newConfig[TOTAL_TODAY_KEY] = YTTAddDurations(duration, config[TOTAL_TODAY_KEY]);
            newConfig[COUNT_TODAY_KEY] = (config[COUNT_TODAY_KEY] ? config[COUNT_TODAY_KEY] : 0) + 1;
            chrome.storage.sync.set(newConfig);
            log("New total time: " + YTTGetDurationString(config[YTT_CONFIG_TOTAL_TIME_KEY]));
        }
        else {
            log("Video isn't new");
        }
    });
}

chrome.storage.sync.get([YTT_CONFIG_USERID, YTT_CONFIG_DEBUG_KEY], function (config) {
    var userID = config[YTT_CONFIG_USERID];

    function getUUID() {
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

    if (!userID) {
        userID = getUUID();
        var newConfig = {};
        newConfig[YTT_CONFIG_USERID] = userID;
        chrome.storage.sync.set(newConfig);
    }
    YTTSetDebug(config[YTT_CONFIG_DEBUG_KEY] || false);
});