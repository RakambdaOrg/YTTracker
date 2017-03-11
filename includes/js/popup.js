$(document).ready(function () {
    YTTApplyThemeCSS('light');

    $('#openoptions').click(function () {
        window.open(chrome.runtime.getURL('options.html'));
    });

    $('#openchart').click(function () {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('chart.html'));
        }
    });

    $('#openstats').click(function () {
        window.open("https://yttracker.mrcraftcod.fr/");
    });

    addTooltip('textrealdurationtoday', 'Time of videos in the "playing state" today');
    addTooltip('texttotaldurationtoday', 'Time of video pages opened today');
    addTooltip('textrealduration', 'Time of videos in the "playing state"');
    addTooltip('texttotalduration', 'Time of video pages opened');
    addTooltip('textcounttoday', 'Number of videos opened today');
    addTooltip('textsince', 'Date since the first record');

    showValue();
});

function addTooltip(id, text) {
    $('#' + id).tipsy({
        gravity: 'n', html: true, title: function () {
            return text;
        }
    });
}

function showValue() {
    YTTLog('UPDATING PRINTED VALUE');
    var TODAY_KEY = YTTGetDayConfigKey();
    YTTGetConfig([YTT_CONFIG_TOTAL_TIME_KEY, YTT_CONFIG_START_TIME_KEY, YTT_CONFIG_REAL_TIME_KEY, TODAY_KEY], function (result) {
        $("#duration").text(YTTGetDurationString(result[YTT_CONFIG_TOTAL_TIME_KEY]));
        $("#realduration").text(YTTGetDurationString(result[YTT_CONFIG_REAL_TIME_KEY]));
        $("#durationtoday").text(YTTGetDurationString(result[TODAY_KEY][YTT_DATA_TOTAL]));
        $("#counttoday").text(result[TODAY_KEY][YTT_DATA_COUNT] || 0);
        $("#realdurationtoday").text(YTTGetDurationString(result[TODAY_KEY][YTT_DATA_REAL]));
        $("#start").text(YTTGetDateString(result[YTT_CONFIG_START_TIME_KEY]));
    });
}
