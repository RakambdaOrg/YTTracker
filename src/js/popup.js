$(document).ready(function(){
    $("#reset").click(function(){
        var resetConfig = {};
        resetConfig[YTT_CONFIG_TOTAL_TIME_KEY] = null;
        resetConfig[YTT_CONFIG_REAL_TIME_KEY] = null;
        resetConfig[YTT_CONFIG_START_TIME_KEY] = null;
        resetConfig[YTT_CONFIG_IDS_WATCHED_KEY] = null;
        chrome.storage.sync.set(resetConfig);
        YTTLog('RESETED STATS');
        showValue();
    });
    showValue();
});

function showValue(){
    YTTLog('UPDATING PRINTED VALUE');
    var TOTAL_TODAY_KEY = YTTGetTotalDayConfigKey();
    var REAL_TODAY_KEY = YTTGetRealDayConfigKey();
    chrome.storage.sync.get([YTT_CONFIG_TOTAL_TIME_KEY, YTT_CONFIG_START_TIME_KEY, YTT_CONFIG_REAL_TIME_KEY, TOTAL_TODAY_KEY, REAL_TODAY_KEY], function (result){
        $("#duration").text(YTTGetDurationString(result[YTT_CONFIG_TOTAL_TIME_KEY]));
        $("#realduration").text(YTTGetDurationString(result[YTT_CONFIG_REAL_TIME_KEY]));
        $("#durationtoday").text(YTTGetDurationString(result[TOTAL_TODAY_KEY]));
        $("#realdurationtoday").text(YTTGetDurationString(result[REAL_TODAY_KEY]));
        $("#start").text(YTTGetDateString(result[YTT_CONFIG_START_TIME_KEY]));
    });
}
