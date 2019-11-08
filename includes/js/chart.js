$(function () {
    am4core.useTheme(am4themes_animated);
    am4core.useTheme(am4themes_material);

    const chartDiv = document.getElementById('chartDiv');
    if (chartDiv) {
        YTTGetConfig(null).then(config => {
            const WEIRD_DATA_THRESHOLD = config[YTT_CONFIG_WEIRD_DATA_THRESHOLD];
            const weirdData = [];
            const data = Object.keys(config).filter(k => k.startsWith('day')).map(k => k.replace('day', '')).sort((a, b) => YTTCompareConfigDate(b, a)).map(day => {
                const conf = new YTTDay(config[`day${day}`]);
                const dayData = {
                    day: day,
                    date: YTTGetDateFromDay(day),
                    watched: conf.getWatchedDuration().getAsMilliseconds(),
                    opened: conf.getOpenedDuration().getAsMilliseconds(),
                    count: conf.getCount(),
                    ratio: conf.getWatchedDuration().getAsMilliseconds() / Math.max(1, Math.max(conf.getWatchedDuration().getAsMilliseconds(), conf.getOpenedDuration().getAsMilliseconds()))
                };
                if (dayData.watched > WEIRD_DATA_THRESHOLD || dayData.opened > WEIRD_DATA_THRESHOLD) {
                    weirdData.push(dayData);
                }
                return dayData;
            });

            function getTotals(list) {
                let totalWatched = 0;
                let totalOpened = 0;
                let totalCount = 0;
                let totalRatio = 0;
                for (let key in list) {
                    if (list.hasOwnProperty(key)) {
                        totalWatched += list[key]['watched'];
                        totalOpened += list[key]['opened'];
                        totalCount += list[key]['count'];
                        totalRatio += list[key]['ratio'];
                    }
                }
                return {
                    watched: totalWatched,
                    opened: totalOpened,
                    ratio: totalRatio,
                    count: totalCount
                };
            }

            function getAverages(data, total) {
                const size = Math.max(data.length, 1);
                return {
                    watched: total['watched'] / size,
                    opened: total['opened'] / size,
                    ratio: total['ratio'] / size,
                    count: total['count'] / size
                };
            }

            const totals = getTotals(data);
            const average = getAverages(data, totals);

            let chart = am4core.create(chartDiv, am4charts.XYChart);
            chart.colors.step = 2;
            chart.data = data;
            chart.dateFormat = 'yyyy-MM-dd';
            chart.numberFormatter.numberFormat = '#.###';
            chart.durationFormatter.durationFormat = 'hh\':\'mm\':\'ss';

            chart.exporting.menu = new am4core.ExportMenu();

            let xDateAxis = chart.xAxes.push(new am4charts.DateAxis());
            xDateAxis.showOnInit = false;
            xDateAxis.title.text = 'Date';
            xDateAxis.skipEmptyPeriods = true;
            xDateAxis.dateFormats.setKey('year', 'yyyy');
            xDateAxis.dateFormats.setKey('month', 'MMM yyyy');
            xDateAxis.dateFormats.setKey('week', 'dd MMM yyyy');
            xDateAxis.dateFormats.setKey('day', 'dd MMM');
            xDateAxis.dateFormats.setKey('hour', 'HH:00');
            xDateAxis.dateFormats.setKey('minute', 'HH:mm');
            xDateAxis.dateFormats.setKey('second', 'HH:mm:ss');
            xDateAxis.baseInterval = {
                'timeUnit': 'day',
                'count': 1
            };
            xDateAxis.renderer.axisFills.template.disabled = false;
            xDateAxis.renderer.axisFills.template.fillOpacity = 0.1;
            xDateAxis.renderer.axisFills.template.fill = am4core.color('gray');

            let yDurationAxis = chart.yAxes.push(new am4charts.DurationAxis());
            yDurationAxis.baseUnit = 'millisecond';
            yDurationAxis.title.text = 'Duration';
            yDurationAxis.min = 0;
            yDurationAxis.strictMinMax = true;

            let yCountAxis = chart.yAxes.push(new am4charts.ValueAxis());
            yCountAxis.title.text = 'Count';
            yCountAxis.renderer.opposite = true;
            yCountAxis.renderer.grid.template.disabled = true;
            yCountAxis.maxPrecision = 0;
            yCountAxis.min = 0;
            yCountAxis.strictMinMax = true;

            chart.legend = new am4charts.Legend();
            chart.legend.useDefaultMarker = true;

            const legendContainer = am4core.create('legendDiv', am4core.Container);
            legendContainer.width = am4core.percent(100);
            legendContainer.height = am4core.percent(100);
            chart.legend.parent = legendContainer;

            function resizeLegend(event) {
                document.getElementById('legendDiv').style.height = chart.legend.contentHeight + 'px';
            }

            chart.events.on('datavalidated', resizeLegend);
            chart.events.on('maxsizechanged', resizeLegend);

            let marker = chart.legend.markers.template.children.getIndex(0);
            marker.cornerRadius(12, 12, 12, 12);
            marker.strokeWidth = 2;
            marker.strokeOpacity = 1;
            marker.stroke = am4core.color('#CCCCCC');

            chart.cursor = new am4charts.XYCursor();
            chart.cursor.xAxis = xDateAxis;

            let seriesWatched = chart.series.push(new am4charts.LineSeries());
            seriesWatched.dataFields.valueY = 'watched';
            seriesWatched.dataFields.dateX = 'date';
            seriesWatched.yAxis = yDurationAxis;
            seriesWatched.minBulletDistance = 20;
            seriesWatched.showOnInit = false;
            seriesWatched.tooltipText = '[bold]{date.formatDate("yyyy-MM-dd")}[/]\nWatched: {watched.formatDuration("hh\'h\' mm\'m\' ss\'s\'")}';

            seriesWatched.name = 'Watched';
            seriesWatched.strokeWidth = 2;
            seriesWatched.stroke = 'green';
            seriesWatched.fill = 'green';

            let bulletWatched = seriesWatched.bullets.push(new am4core.Circle());
            bulletWatched.radius = 5;

            let seriesOpened = chart.series.push(new am4charts.LineSeries());
            seriesOpened.dataFields.valueY = 'opened';
            seriesOpened.dataFields.dateX = 'date';
            seriesOpened.yAxis = yDurationAxis;
            seriesOpened.minBulletDistance = 20;
            seriesOpened.showOnInit = false;
            seriesOpened.tooltipText = '[bold]{date.formatDate("yyyy-MM-dd")}[/]\nOpened: {opened.formatDuration("hh\'h\' mm\'m\' ss\'s\'")}';

            seriesOpened.name = 'Opened';
            seriesOpened.strokeWidth = 2;
            seriesOpened.stroke = 'red';
            seriesOpened.fill = 'red';

            let bulletOpened = seriesOpened.bullets.push(new am4core.Circle());
            bulletOpened.radius = 5;

            let seriesCount = chart.series.push(new am4charts.LineSeries());
            seriesCount.dataFields.valueY = 'count';
            seriesCount.dataFields.dateX = 'date';
            seriesCount.yAxis = yCountAxis;
            seriesCount.minBulletDistance = 20;
            seriesCount.showOnInit = false;
            seriesCount.tooltipText = '[bold]{date.formatDate("yyyy-MM-dd")}[/]\nCount: {count}';

            seriesCount.name = 'Count';
            seriesCount.strokeWidth = 2;
            seriesCount.stroke = 'blue';
            seriesCount.fill = 'blue';

            let bulletCount = seriesCount.bullets.push(new am4core.Circle());
            bulletCount.radius = 5;

            function toggleAxes(ev) {
                let axis = ev.target.yAxis;
                let disabled = true;
                axis.series.each(function (series) {
                    if (!series.isHiding && !series.isHidden) {
                        disabled = false;
                    }
                });
                axis.disabled = disabled;
            }

            seriesWatched.events.on('hidden', toggleAxes);
            seriesWatched.events.on('shown', toggleAxes);
            seriesOpened.events.on('hidden', toggleAxes);
            seriesOpened.events.on('shown', toggleAxes);
            seriesCount.events.on('hidden', toggleAxes);
            seriesCount.events.on('shown', toggleAxes);

            chart.scrollbarX = new am4core.Scrollbar();
            chart.scrollbarY = new am4core.Scrollbar();

            xDateAxis.events.on('startchanged', dateAxisChanged);
            xDateAxis.events.on('endchanged', dateAxisChanged);

            function dateAxisChanged(ev) {
                const startDate = new Date(ev.target.minZoomed);
                const endDate = new Date(ev.target.maxZoomed);
                const periodData = data.filter(d => {
                    return d['date'] >= startDate && d['date'] <= endDate;
                });
                updatePeriodData(periodData);
            }

            chart.events.on('ready', () => {
                let oneWeekAgo = new Date();
                oneWeekAgo.setHours(0);
                oneWeekAgo.setMinutes(0);
                oneWeekAgo.setSeconds(0);
                oneWeekAgo.setMilliseconds(0);
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                xDateAxis.zoomToDates(
                    oneWeekAgo,
                    new Date(),
                    false,
                    true
                );
            });

            const todayKey = YTTGetDayConfigKey();
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

            $('#totalWatched').text(new YTTDuration(null, totals['watched']).getAsString());
            $('#totalOpened').text(new YTTDuration(null, totals['opened']).getAsString());
            $('#totalCount').text(totals['count']);

            $('#totalAverageWatched').text(new YTTDuration(null, average['watched']).getAsString());
            $('#totalAverageOpened').text(new YTTDuration(null, average['opened']).getAsString());
            $('#totalAverageCount').text(average['count'].toFixed(2));
            $('#totalAverageRatio').text((100 * average['ratio']).toFixed(2) + '%');

            function updatePeriodData(periodData) {
                const periodTotal = getTotals(periodData);
                const periodAverage = getAverages(periodData, periodTotal);

                $('#periodWatched').text(new YTTDuration(null, periodTotal['watched']).getAsString());
                $('#periodOpened').text(new YTTDuration(null, periodTotal['opened']).getAsString());
                $('#periodCount').text(periodTotal['count']);

                $('#periodDays').text(periodData.length);
                $('#periodAverageWatched').text(new YTTDuration(null, periodAverage['watched']).getAsString());
                $('#periodAverageOpened').text(new YTTDuration(null, periodAverage['opened']).getAsString());
                $('#periodAverageCount').text(periodAverage['count'].toFixed(2));
                $('#periodAverageRatio').text((100 * periodAverage['ratio']).toFixed(2) + '%');
            }

            if (weirdData.length > 0) {
                $('#weird-day-counter').text(weirdData.length);
                $('#weridValueAlert').removeClass('d-none');
            }
        });
    }
});
