var activePlayers = {};

function log(text){
    if (YTT_DEBUG)
        console.log(text);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
    if(request[YTT_MESSAGE_TYPE_KEY] == YTT_LOG_EVENT){
        log(request[YTT_MESSAGE_VALUE_KEY] || "undefined");
    }
    else if(request[YTT_MESSAGE_TYPE_KEY] == YTT_STATE_EVENT){
        request[YTT_MESSAGE_VALUE_KEY][YTT_STATE_EVENT_ID_KEY] = sender.tab.id;
        playerStateChange(request[YTT_MESSAGE_VALUE_KEY]);
    }
    else if(request[YTT_MESSAGE_TYPE_KEY] == YTT_DURATION_EVENT)
        setVideoDuration(request[YTT_MESSAGE_VALUE_KEY])
});

function playerStateChange(event){
    if(event[YTT_STATE_EVENT_STATE_KEY] == 1){
        log("Started playing at " + event[YTT_STATE_EVENT_TIME_KEY] + "s");
        chrome.browserAction.setBadgeText({text:"P"});
        activePlayers[event[YTT_STATE_EVENT_ID_KEY]] = event[YTT_STATE_EVENT_TIME_KEY];
    }
    else if((event[YTT_STATE_EVENT_STATE_KEY] == 2 || event[YTT_STATE_EVENT_STATE_KEY] == 0 || event[YTT_STATE_EVENT_STATE_KEY] == -5) && activePlayers[event[YTT_STATE_EVENT_ID_KEY]] != null){
        log("Ended playing at " + event[YTT_STATE_EVENT_TIME_KEY] + "s");
        var REAL_TODAY_KEY = YTTGetRealDayConfigKey();
        var duration = {milliseconds: parseInt((event[YTT_STATE_EVENT_TIME_KEY] - activePlayers[event[YTT_STATE_EVENT_ID_KEY]]) * 1000)};
        activePlayers[event[YTT_STATE_EVENT_ID_KEY]] = null;
        var size = 0, key;
        for (key in activePlayers) if(activePlayers.hasOwnProperty(key) && activePlayers[key] != null) size++;
        if(size < 1)chrome.browserAction.setBadgeText({text:""});
        chrome.storage.sync.get([YTT_CONFIG_REAL_TIME_KEY, REAL_TODAY_KEY], function (config){
            var newConfig = {};
            newConfig[YTT_CONFIG_REAL_TIME_KEY] = YTTAddDurations(duration, config[YTT_CONFIG_REAL_TIME_KEY]);
            newConfig[REAL_TODAY_KEY] = YTTAddDurations(duration, config[REAL_TODAY_KEY]);
            chrome.storage.sync.set(newConfig);
            log("Added real time: " + YTTGetDurationString(duration));
        });
    }
}

function setVideoDuration(event){
    var TOTAL_TODAY_KEY = YTTGetTotalDayConfigKey();
    chrome.storage.sync.get([YTT_CONFIG_IDS_WATCHED_KEY, YTT_CONFIG_START_TIME_KEY, YTT_CONFIG_TOTAL_TIME_KEY, TOTAL_TODAY_KEY], function (config){
        var IDS = config[YTT_CONFIG_IDS_WATCHED_KEY] || [];
        if (!IDS || IDS.indexOf(event[YTT_DURATION_EVENT_ID_KEY]) === -1){
            IDS.push(event[YTT_DURATION_EVENT_ID_KEY]);
            var duration = {milliseconds: parseInt(event[YTT_DURATION_EVENT_DURATION_KEY] * 1000)};
            var newConfig = {};
            newConfig[YTT_CONFIG_TOTAL_TIME_KEY] = YTTAddDurations(duration, config[YTT_CONFIG_TOTAL_TIME_KEY]);
            newConfig[YTT_CONFIG_IDS_WATCHED_KEY] = IDS;
            newConfig[YTT_CONFIG_START_TIME_KEY] = config[YTT_CONFIG_START_TIME_KEY] || new Date().getTime();
            newConfig[TOTAL_TODAY_KEY] = YTTAddDurations(duration ,config[TOTAL_TODAY_KEY]);
            chrome.storage.sync.set(newConfig);
            log("New total time: " + YTTGetDurationString(config[YTT_CONFIG_TOTAL_TIME_KEY]));
        }
    });
}