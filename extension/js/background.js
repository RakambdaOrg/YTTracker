'use strict';

var activePlayers = {};

chrome.storage.sync.get(null, function (conf) {
    var newConfig = {};
    var shouldClear = false;

    function isValidExKey(key) {
        return key === 'C' || key === 'R' || key === 'T';
    }

    if (YTTCompareVersion('1.3.0', conf[YTT_CONFIG_VERSION]) > 0) {
        notify('YTTracker', 'Converting stored data...', true);
        for (var key in conf) {
            if (conf.hasOwnProperty(key) && key.substring(0, 3) == 'day' && isValidExKey(key.substring(key.length - 1))) {
                var label = key.substring(key.length - 1);
                var day = key.substring(0, key.length - 1);
                switch (label) {
                    case 'C':
                        newConfig[day] = YTTAddConfigCount(conf[key], newConfig[day]);
                        break;
                    case 'R':
                        newConfig[day] = YTTAddConfigDuration(conf[key], newConfig[day], YTT_DATA_REAL);
                        break;
                    case 'T':
                        newConfig[day] = YTTAddConfigDuration(conf[key], newConfig[day], YTT_DATA_TOTAL);
                        break;
                }
            }
            else {
                newConfig[key] = conf[key];
            }
        }
        shouldClear = true;
        notify('YTTracker', 'Converting done', true);
    }
    newConfig[YTT_CONFIG_VERSION] = chrome.app.getDetails().version;
    if (shouldClear) {
        chrome.storage.sync.clear(function () {
            chrome.storage.sync.set(newConfig);
        })
    }
    else {
        chrome.storage.sync.set(newConfig);
    }
});

function log(text) {
    if (YTT_DEBUG) {
        console.log(text);
    }
}

function notify(title, text, force) {
    if (YTT_DEBUG || force)
    {
        chrome.notifications.getPermissionLevel(function (permissionLevel) {
            if (permissionLevel === 'granted') {
                chrome.notifications.create('', {
                    type: 'basic',
                    iconUrl: '/assets/icon128.png',
                    title: title,
                    message: text
                });
            }
        });
    }
}

//noinspection JSCheckFunctionSignatures
chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request[YTT_MESSAGE_TYPE_KEY] == YTT_LOG_EVENT) {
        log(request[YTT_MESSAGE_VALUE_KEY] || "undefined");
    }
    else if (request[YTT_MESSAGE_TYPE_KEY] == YTT_STATE_EVENT) {
        request[YTT_MESSAGE_VALUE_KEY][YTT_STATE_EVENT_ID_KEY] = sender.tab.id;
        playerStateChange(request[YTT_MESSAGE_VALUE_KEY]);
    }
    else if (request[YTT_MESSAGE_TYPE_KEY] == YTT_DURATION_EVENT) {
        request[YTT_MESSAGE_VALUE_KEY][YTT_DURATION_EVENT_TABID_KEY] = sender.tab.id;
        setVideoDuration(request[YTT_MESSAGE_VALUE_KEY])
    }
});

function playerStateChange(event) {
    if (event[YTT_STATE_EVENT_STATE_KEY] == 1) {
        log("Started playing at " + event[YTT_STATE_EVENT_TIME_KEY] + "s");
        chrome.browserAction.setBadgeText({text: "P"});
        activePlayers[event[YTT_STATE_EVENT_ID_KEY]] = {
            time: event[YTT_STATE_EVENT_TIME_KEY],
            vid: event[YTT_STATE_EVENT_VID_KEY]
        };
    }
    else if ((event[YTT_STATE_EVENT_STATE_KEY] == 2 || event[YTT_STATE_EVENT_STATE_KEY] == 0 || event[YTT_STATE_EVENT_STATE_KEY] == -5) && activePlayers[event[YTT_STATE_EVENT_ID_KEY]] != null) {
        log("Ended playing at " + event[YTT_STATE_EVENT_TIME_KEY] + "s");
        var TODAY_KEY = YTTGetDayConfigKey();
        var duration = {milliseconds: parseInt((event[YTT_STATE_EVENT_TIME_KEY] - activePlayers[event[YTT_STATE_EVENT_ID_KEY]]['time']) * 1000)};
        var videoID = activePlayers[event[YTT_STATE_EVENT_ID_KEY]]['vid'];
        activePlayers[event[YTT_STATE_EVENT_ID_KEY]] = null;
        var size = 0, key;
        for (key in activePlayers) if (activePlayers.hasOwnProperty(key) && activePlayers[key] != null) size++;
        if (size < 1)chrome.browserAction.setBadgeText({text: ""});
        chrome.storage.sync.get([YTT_CONFIG_REAL_TIME_KEY, TODAY_KEY, YTT_CONFIG_SHARE_ONLINE, YTT_CONFIG_USERID], function (config) {
            if (config[YTT_CONFIG_SHARE_ONLINE] === true) {
                $.ajax({
                    url: 'https://yttracker.mrcraftcod.fr/api/stats/add?uuid=' + encodeURI(config[YTT_CONFIG_USERID]) + '&videoID=' + encodeURI(videoID) + "&type=1&stats=" + YTTGetDurationAsMillisec(duration),
                    method: 'POST',
                    error: function () {
                        notify('YTTError', 'Failed to send watched time to server (' + videoID + ' -- ' + YTTGetDurationString(duration) + ')');
                        console.error("YTTF2" + videoID + ':' + YTTGetDurationString(duration));
                    },
                    success: function () {
                        notify('YTTracker', 'Sent watched time to server (' + videoID + ' -- ' + YTTGetDurationString(duration) + ')');
                        console.log("YTTO2-" + videoID + ':' + YTTGetDurationString(duration));
                    }
                });
            }
            var newConfig = {};
            newConfig[YTT_CONFIG_REAL_TIME_KEY] = YTTAddDurations(duration, config[YTT_CONFIG_REAL_TIME_KEY]);
            newConfig[TODAY_KEY] = YTTAddConfigDuration(duration, config[TODAY_KEY], YTT_DATA_REAL);
            chrome.storage.sync.set(newConfig);
            log("Added real time: " + YTTGetDurationString(duration));
        });
    }
}

function setVideoDuration(event) {
    var TODAY_KEY = YTTGetDayConfigKey();
    chrome.storage.sync.get([YTT_CONFIG_IDS_WATCHED_KEY, YTT_CONFIG_START_TIME_KEY, YTT_CONFIG_TOTAL_TIME_KEY, TODAY_KEY, YTT_CONFIG_SHARE_ONLINE, YTT_CONFIG_USERID], function (config) {
        var toRemove = [];
        var IDS = config[YTT_CONFIG_IDS_WATCHED_KEY] || {};
        //noinspection JSDuplicatedDeclaration
        for (var key in IDS) {
            if (IDS.hasOwnProperty(key)) {
                if (new Date().getTime() - IDS[key] > 60 * 60 * 1000) {
                    toRemove.push(key);
                }
            }
        }
        //noinspection JSDuplicatedDeclaration
        for (var key in toRemove) {
            delete IDS[toRemove[key]];
        }
        if (event[YTT_DURATION_EVENT_ID_KEY] === 'undefined') {
            log('Not video page');
            return;
        }
        if (!IDS.hasOwnProperty(event[YTT_DURATION_EVENT_ID_KEY])) {
            IDS[event[YTT_DURATION_EVENT_ID_KEY]] = new Date().getTime();
            var duration = {milliseconds: parseInt(event[YTT_DURATION_EVENT_DURATION_KEY] * 1000)};
            if (config[YTT_CONFIG_SHARE_ONLINE] === true) {
                $.ajax({
                    url: 'https://yttracker.mrcraftcod.fr/api/stats/add?uuid=' + encodeURI(config[YTT_CONFIG_USERID]) + '&videoID=' + encodeURI(event[YTT_DURATION_EVENT_ID_KEY]) + "&type=2&stats=" + YTTGetDurationAsMillisec(duration),
                    method: 'POST',
                    error: function () {
                        notify('YTTracker', 'Failed to send opened time to server (' + event[YTT_DURATION_EVENT_ID_KEY] + ' -- ' + YTTGetDurationString(duration) + ')');
                        console.error("YTTF1-" + event[YTT_DURATION_EVENT_ID_KEY] + ':' + YTTGetDurationString(duration));
                    },
                    success: function () {
                        notify('YTTracker', 'Sent opened time to server (' + event[YTT_DURATION_EVENT_ID_KEY] + ' -- ' + YTTGetDurationString(duration) + ')');
                        console.log("YTTO1-" + event[YTT_DURATION_EVENT_ID_KEY] + ':' + YTTGetDurationString(duration));
                    }
                });
            }
            var newConfig = {};
            newConfig[YTT_CONFIG_TOTAL_TIME_KEY] = YTTAddDurations(duration, config[YTT_CONFIG_TOTAL_TIME_KEY]);
            newConfig[YTT_CONFIG_IDS_WATCHED_KEY] = IDS;
            newConfig[YTT_CONFIG_START_TIME_KEY] = config[YTT_CONFIG_START_TIME_KEY] || new Date().getTime();
            newConfig[TODAY_KEY] = YTTAddConfigCount(1, YTTAddConfigDuration(duration, config[TODAY_KEY], YTT_DATA_TOTAL));
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