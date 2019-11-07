$(function () {
    $('#openOptionsButton').on('click', function () {
        YTTOpenOptionsPage().catch(() => {
            YTTOpenTabURL({url: YTTGetRuntimeURL('options.html')});
        });
    });

    $('#openChartButton').on('click', function () {
        YTTOpenTabURL({url: YTTGetRuntimeURL('chart.html')});
    });

    $('#openOnlineStatsButton').on('click', function () {
        YTTOpenTabURL({url: 'https://yttracker.mrcraftcod.fr/'});
    });

    const todayKey = YTTGetDayConfigKey();
    YTTGetConfig([YTT_CONFIG_TOTAL_STATS_KEY, YTT_CONFIG_START_TIME_KEY, todayKey]).then(config => {
        // noinspection DuplicatedCode
        const configDay = config[todayKey];
        if (configDay) {
            const todayDay = new YTTDay(configDay);

            $('#todayWatched').text(todayDay.getWatchedDuration().getAsString());
            $('#todayOpened').text(todayDay.getOpenedDuration().getAsString());
            $('#todayCount').text(todayDay.getCount());
        } else {
            $('#todayWatched').text('No data');
            $('#todayOpened').text('No data');
            $('#todayCount').text('No data');
        }

        const totals = new YTTDay(config[YTT_CONFIG_TOTAL_STATS_KEY]);
        $('#totalWatched').text(totals.getWatchedDuration().getAsString());
        $('#totalOpened').text(totals.getOpenedDuration().getAsString());
        $('#totalCount').text(totals.getCount());

        $('#totalStartDate').text(YTTGetDateString(config[YTT_CONFIG_START_TIME_KEY]));
    });

});

