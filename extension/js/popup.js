$(document).ready(function () {
    if (YTT_DEBUG)$("#resettoday").show();

    $("#reset").click(function () {
        var resetConfig = {};
        resetConfig[YTT_CONFIG_TOTAL_TIME_KEY] = null;
        resetConfig[YTT_CONFIG_REAL_TIME_KEY] = null;
        resetConfig[YTT_CONFIG_START_TIME_KEY] = null;
        resetConfig[YTT_CONFIG_IDS_WATCHED_KEY] = null;
        chrome.storage.sync.set(resetConfig);
        YTTLog('RESETED TOTAL STATS');
        showValue();
    });

    $("#resettoday").click(function () {
        var resetConfig = {};
        resetConfig[YTTGetTotalDayConfigKey()] = null;
        resetConfig[YTTGetRealDayConfigKey()] = null;
        chrome.storage.sync.set(resetConfig);
        YTTLog('RESETED TODAY STATS');
        showValue();
    });

    $('#openoptions').click(function () {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });

    addTooltip('textrealdurationtoday', 'Time of videos in the "playing state" today');
    addTooltip('texttotaldurationtoday', 'Time of video pages opened today');
    addTooltip('textrealduration', 'Time of videos in the "playing state"');
    addTooltip('texttotalduration', 'Time of video pages opened');
    addTooltip('textsince', 'Date since the first record');

    showValue();
});

function addTooltip(id, text) {
    $('#' + id + '>').tipsy({
        gravity: 'n', html: true, title: function () {
            return text;
        }
    });
}

function showValue() {
    YTTLog('UPDATING PRINTED VALUE');
    var TOTAL_TODAY_KEY = YTTGetTotalDayConfigKey();
    var REAL_TODAY_KEY = YTTGetRealDayConfigKey();
    chrome.storage.sync.get([YTT_CONFIG_TOTAL_TIME_KEY, YTT_CONFIG_START_TIME_KEY, YTT_CONFIG_REAL_TIME_KEY, TOTAL_TODAY_KEY, REAL_TODAY_KEY], function (result) {
        $("#duration").text(YTTGetDurationString(result[YTT_CONFIG_TOTAL_TIME_KEY]));
        $("#realduration").text(YTTGetDurationString(result[YTT_CONFIG_REAL_TIME_KEY]));
        $("#durationtoday").text(YTTGetDurationString(result[TOTAL_TODAY_KEY]));
        $("#realdurationtoday").text(YTTGetDurationString(result[REAL_TODAY_KEY]));
        $("#start").text(YTTGetDateString(result[YTT_CONFIG_START_TIME_KEY]));
    });
}
