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
        activePlayers[event[YTT_STATE_EVENT_ID_KEY]] = {time: event[YTT_STATE_EVENT_TIME_KEY], vid: event[YTT_STATE_EVENT_VID_KEY]};
    }
    else if ((event[YTT_STATE_EVENT_STATE_KEY] == 2 || event[YTT_STATE_EVENT_STATE_KEY] == 0 || event[YTT_STATE_EVENT_STATE_KEY] == -5) && activePlayers[event[YTT_STATE_EVENT_ID_KEY]] != null) {
        log("Ended playing at " + event[YTT_STATE_EVENT_TIME_KEY] + "s");
        var REAL_TODAY_KEY = YTTGetRealDayConfigKey();
        var duration = {milliseconds: parseInt((event[YTT_STATE_EVENT_TIME_KEY] - activePlayers[event[YTT_STATE_EVENT_ID_KEY]]['time']) * 1000)};
        var videoID = activePlayers[event[YTT_STATE_EVENT_ID_KEY]]['vid'];
        activePlayers[event[YTT_STATE_EVENT_ID_KEY]] = null;
        var size = 0, key;
        for (key in activePlayers) if (activePlayers.hasOwnProperty(key) && activePlayers[key] != null) size++;
        if (size < 1)chrome.browserAction.setBadgeText({text: ""});
        chrome.storage.sync.get([YTT_CONFIG_REAL_TIME_KEY, REAL_TODAY_KEY, YTT_CONFIG_SHARE_ONLINE, YTT_CONFIG_USERID], function (config) {
            if(config[YTT_CONFIG_SHARE_ONLINE] === true){
                $.ajax({
                    url: 'https://yttracker.mrcraftcod.fr/api/stats/add?uuid=' + encodeURI(config[YTT_CONFIG_USERID]) + '&videoID=' + encodeURI(videoID) + "&type=1&stats=" + YTTGetDurationAsMillisec(duration),
                    method: 'POST',
                    error: function(a, b ,c){
                        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                            chrome.tabs.sendMessage(tabs[0].id, {action: 'alertPopup', message: 'YTTF2-' + videoID + ':' + YTTGetDurationString(duration)}, function(response) {});
                        });
                        console.error("YTTF2" + videoID + ':' + YTTGetDurationString(duration));
                    },
                    success: function(){
                        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                            chrome.tabs.sendMessage(tabs[0].id, {action: 'alertPopup', message: 'YTTO2-' + videoID + ':' + YTTGetDurationString(duration)}, function(response) {});
                        });
                        console.log("YTTO2-" + videoID + ':' + YTTGetDurationString(duration));
                    }
                });
            }
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
    chrome.storage.sync.get([YTT_CONFIG_IDS_WATCHED_KEY, YTT_CONFIG_START_TIME_KEY, YTT_CONFIG_TOTAL_TIME_KEY, TOTAL_TODAY_KEY, COUNT_TODAY_KEY, YTT_CONFIG_SHARE_ONLINE, YTT_CONFIG_USERID], function (config) {
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
            delete IDS[toRemove[key]];
        }
        if (!IDS.hasOwnProperty(event[YTT_DURATION_EVENT_ID_KEY])) {
            IDS[event[YTT_DURATION_EVENT_ID_KEY]] = new Date().getTime();
            var duration = {milliseconds: parseInt(event[YTT_DURATION_EVENT_DURATION_KEY] * 1000)};
            if(config[YTT_CONFIG_SHARE_ONLINE] === true){
                $.ajax({
                    url: 'https://yttracker.mrcraftcod.fr/api/stats/add?uuid=' + encodeURI(config[YTT_CONFIG_USERID]) + '&videoID=' + encodeURI(event[YTT_DURATION_EVENT_ID_KEY]) + "&type=2&stats=" + YTTGetDurationAsMillisec(duration),
                    method: 'POST',
                    error: function(a, b ,c){
                        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                            chrome.tabs.sendMessage(tabs[0].id, {action: 'alertPopup', message: 'YTTF1-' + event[YTT_DURATION_EVENT_ID_KEY]  + ':' + YTTGetDurationString(duration)}, function(response) {});
                        });
                        console.error("YTTF1-" + event[YTT_DURATION_EVENT_ID_KEY] + ':' + YTTGetDurationString(duration));
                    },
                    success: function(){
                        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                            chrome.tabs.sendMessage(tabs[0].id, {action: 'alertPopup', message: 'YTTO1-' + event[YTT_DURATION_EVENT_ID_KEY]  + ':' + YTTGetDurationString(duration)}, function(response) {});
                        });
                        console.log("YTTO1-" + event[YTT_DURATION_EVENT_ID_KEY] + ':' + YTTGetDurationString(duration));
                    }
                });
            }
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

    if (!userID) {
        userID = YTTGenUUID();
        var newConfig = {};
        newConfig[YTT_CONFIG_USERID] = userID;
        chrome.storage.sync.set(newConfig);
    }
    YTTSetDebug(config[YTT_CONFIG_DEBUG_KEY] || false);
});