safari.application.addEventListener("command", performCommand, false);
safari.application.addEventListener('message', handleMessage, false);

var activePlayers = {};

function performCommand(event) {
    if (event.command == "yttracker-button") {
        var newTab = safari.application.activeBrowserWindow.openTab();
        newTab.url = "https://yttracker.mrcraftcod.fr/";
    }
}

function log(message) {
    console.log(message);
}

function handleMessage(msg) {
    if (msg.name === 'YTTracker') {
        var request = msg.message;
        if (request[YTT_MESSAGE_TYPE_KEY] == YTT_LOG_EVENT) {
            log(request[YTT_MESSAGE_VALUE_KEY] || "undefined");
        }
        else if (request[YTT_MESSAGE_TYPE_KEY] == YTT_STATE_EVENT) {
            request[YTT_MESSAGE_VALUE_KEY][YTT_STATE_EVENT_ID_KEY] = msg.target.url;
            playerStateChange(request[YTT_MESSAGE_VALUE_KEY]);
        }
        else if (request[YTT_MESSAGE_TYPE_KEY] == YTT_DURATION_EVENT) {
            request[YTT_MESSAGE_VALUE_KEY][YTT_DURATION_EVENT_TABID_KEY] = msg.target.url;
            setVideoDuration(request[YTT_MESSAGE_VALUE_KEY])
        }
    }
}

function sendRequest(request) {
    function send(uuid, vid, dur, date) {
        function getDate(timestamp){
            if(!timestamp){
                timestamp = new Date().getTime();
            }
            var d = new Date(timestamp);
            return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
        }

        if (YTTGetDurationAsMillisec(dur) === 0) {
            return true;
        }
        var rVal = false;
        $.ajax({
            url: 'https://yttracker.mrcraftcod.fr/api/stats/add?uuid=' + encodeURI(uuid) + '&videoID=' + encodeURI(vid) + "&type=" + request['type'] + "&stats=" + YTTGetDurationAsMillisec(dur) + "&date=" + encodeURI(getDate(date)),
            method: 'POST',
            async: false,
            error: function () {
                console.error("YTTF" + request['type'] + '-' + vid + ':' + YTTGetDurationString(dur), true);
                console.error(request, true);
            },
            success: function () {
                rVal = true;
                console.log("YTTO-" + request['type'] + '-' + vid + ':' + YTTGetDurationString(dur));
            }
        });
        return rVal;
    }

    request['date'] = new Date().getTime();
    var config = {};
    config[YTT_CONFIG_USERID] = safari.extension.settings.getItem(YTT_CONFIG_USERID);
    config[YTT_CONFIG_FAILED_SHARE] = safari.extension.settings.getItem(YTT_CONFIG_FAILED_SHARE);
    config[YTT_CONFIG_FAILED_SHARE] = config[YTT_CONFIG_FAILED_SHARE] || [];
    config[YTT_CONFIG_FAILED_SHARE].push(request);
    var toDel = [];
    //noinspection JSDuplicatedDeclaration
    for (var key in config[YTT_CONFIG_FAILED_SHARE]) {
        if (config[YTT_CONFIG_FAILED_SHARE].hasOwnProperty(key)) {
            var req = config[YTT_CONFIG_FAILED_SHARE][key];
            if (req && req['videoID'] && req['duration']) {
                if (send(config[YTT_CONFIG_USERID], req['videoID'], req['duration'], req['date'])) {
                    toDel.push(key);
                }
            }
            else {
                toDel.push(key);
            }
        }
    }
    //noinspection JSDuplicatedDeclaration
    for (var key in toDel) {
        delete config[YTT_CONFIG_FAILED_SHARE][toDel[key]];
    }
    safari.extension.settings.setItem(YTT_CONFIG_FAILED_SHARE, config[YTT_CONFIG_FAILED_SHARE]);
}

function playerStateChange(event) {
    if (event[YTT_STATE_EVENT_STATE_KEY] == 1) {
        log("Started playing at " + event[YTT_STATE_EVENT_TIME_KEY] + "s");
        safari.extension.toolbarItems.forEach(function(element){
            element.badge = 1;
        });
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
        if (size < 1)
            safari.extension.toolbarItems.forEach(function(element){
                element.badge = 0;
            });
        var config = {};
        config[YTT_CONFIG_REAL_TIME_KEY] = safari.extension.settings.getItem(YTT_CONFIG_REAL_TIME_KEY);
        config[TODAY_KEY] = safari.extension.settings.getItem(TODAY_KEY);
        config[YTT_CONFIG_SHARE_ONLINE] = safari.extension.settings.getItem(YTT_CONFIG_SHARE_ONLINE);
        if (config[YTT_CONFIG_SHARE_ONLINE] === true) {
            sendRequest({
                videoID: videoID,
                type: 1,
                duration: duration
            });
        }
        safari.extension.settings.setItem(YTT_CONFIG_REAL_TIME_KEY, YTTAddDurations(duration, config[YTT_CONFIG_REAL_TIME_KEY]));
        safari.extension.settings.setItem(TODAY_KEY, YTTAddConfigDuration(duration, config[TODAY_KEY], YTT_DATA_REAL));
        log("Added real time: " + YTTGetDurationString(duration));
    }
}

function setVideoDuration(event) {
    var TODAY_KEY = YTTGetDayConfigKey();
    var config = {};
    config[YTT_CONFIG_IDS_WATCHED_KEY] = safari.extension.settings.getItem(YTT_CONFIG_IDS_WATCHED_KEY);
    config[YTT_CONFIG_START_TIME_KEY] = safari.extension.settings.getItem(YTT_CONFIG_START_TIME_KEY);
    config[YTT_CONFIG_TOTAL_TIME_KEY] = safari.extension.settings.getItem(YTT_CONFIG_TOTAL_TIME_KEY);
    config[TODAY_KEY] = safari.extension.settings.getItem(TODAY_KEY);
    config[YTT_CONFIG_SHARE_ONLINE] = safari.extension.settings.getItem(YTT_CONFIG_SHARE_ONLINE);
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
            sendRequest({
                videoID: event[YTT_DURATION_EVENT_ID_KEY],
                type: 2,
                duration: duration
            });
        }
        var newTime = YTTAddDurations(duration, config[YTT_CONFIG_TOTAL_TIME_KEY]);
        safari.extension.settings.setItem(YTT_CONFIG_TOTAL_TIME_KEY, newTime);
        safari.extension.settings.setItem(YTT_CONFIG_IDS_WATCHED_KEY, IDS);
        safari.extension.settings.setItem(YTT_CONFIG_START_TIME_KEY, config[YTT_CONFIG_START_TIME_KEY] || new Date().getTime());
        safari.extension.settings.setItem(TODAY_KEY, YTTAddConfigCount(1, YTTAddConfigDuration(duration, config[TODAY_KEY], YTT_DATA_TOTAL)));
        log("New total time: " + YTTGetDurationString(newTime));
    }
    else {
        log("Video isn't new");
    }
}
