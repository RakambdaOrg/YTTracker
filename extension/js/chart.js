$(document).ready(function () {
    //Resize chart to fit height
    var chartHolder = document.getElementById('chartHolder');
    var chartdiv = document.getElementById('chartdiv');
    new ResizeSensor(chartHolder, function () {
        chartdiv.style.height = '' + chartHolder.clientHeight + 'px';
    });

    function getChartColors(theme, handwritten) {
        switch (theme) {
            case 'light':
                return {
                    theme: 'light',
                    selectedBackgroundColor: '#EFEFEF',
                    gridColor: '#FFFFFF',
                    color: '#FFFFFF',
                    scrollBarBackgroundColor: '#D4D4D4',
                    labelColor: '#222222',
                    handDrawn: handwritten,
                    backgroundColor: '#BBBBBB'
                };
            case 'dark':
            default:
                return {
                    theme: 'dark',
                    selectedBackgroundColor: '#444444',
                    gridColor: '#999999',
                    color: '#111111',
                    scrollBarBackgroundColor: '#666666',
                    labelColor: '#000000',
                    handDrawn: handwritten,
                    backgroundColor: '#777777'
                };
        }
    }

    AmCharts.ready(function () {
        chrome.storage.sync.get(null, function (config) {
            YTTApplyThemeCSS(config[YTT_CONFIG_THEME]);
            var chartColors = getChartColors(config[YTT_CONFIG_THEME], config[YTT_CONFIG_HANDDRAWN] === 'true');

            //Get days from config
            const parsedConfig = {};
            var minDate = '19999';
            var maxDate = '0';
            for (var key in config) {
                if (config.hasOwnProperty(key) && key.substring(0, 3) == 'day') {
                    var day = key.substring(3, key.length - 1);
                    if (!parsedConfig[day]) {
                        parsedConfig[day] = {R: 0, T: 0, C: 0};
                    }
                    parsedConfig[day][key.substring(key.length - 1)] = config[key];
                    if (YTTCompareConfigDate(minDate, day) < 0) {
                        minDate = day;
                    }
                    if (YTTCompareConfigDate(maxDate, day) > 0) {
                        maxDate = day;
                    }
                }
            }
            if (YTTCompareConfigDate(maxDate, YTTGetDayConfigKey(new Date()).substr(3)) > 0) {
                maxDate = YTTGetDayConfigKey(new Date()).substr(3);
            }
            //Add missing dates
            var current = minDate;
            var i = 0;
            var getNextConfigDate = function (date) {
                var year = parseFloat(date.substring(date.length - 4));
                var days = parseFloat(date.substring(0, date.length - 4));
                var dateObj = new Date(year, 0);
                dateObj.setDate(days + 1);
                return YTTGetDayConfigKey(dateObj).substr(3);
            };
            while (YTTCompareConfigDate(maxDate, current) < 0 && i < 365 * 10) {
                i++;
                current = getNextConfigDate(current);
                if (!parsedConfig.hasOwnProperty(current)) {
                    parsedConfig[current] = {R: 0, T: 0, C: 0};
                }
            }
            //Reorder dates
            const parsedConfigOrdered = [];
            Object.keys(parsedConfig).sort(function (a, b) {
                return YTTCompareConfigDate(b, a);
            }).forEach(function (key) {
                var conf = parsedConfig[key];
                conf['day'] = key;
                parsedConfigOrdered.push(conf);
            });

            var datas = buildData(parsedConfigOrdered);

            //Build Chart
            function getAverages(list) {
                var totalR = 0;
                var totalT = 0;
                var totalC = 0;
                var totalRatio = 0;
                for (var key in list) {
                    if (list.hasOwnProperty(key)) {
                        totalR += YTTGetDurationAsMillisec({hours: list[key]['real']});
                        totalT += YTTGetDurationAsMillisec({hours: list[key]['total']});
                        totalC += YTTGetDurationAsMillisec({hours: list[key]['count']});
                        totalRatio += list[key]['ratio'];
                    }
                }
                return {real: totalR / list.length, total: totalT / list.length, ratio: totalRatio / list.length, count: totalC / list.length};
            }

            var avgs = getAverages(datas);
            var average = {
                real: {milliseconds: avgs['real']},
                total: {milliseconds: avgs['total']},
                ratio: avgs['ratio'],
                count: avgs['count']
            };

            var chart = AmCharts.makeChart(chartdiv, {
                type: 'serial',
                theme: chartColors['theme'],
                backgroundAlpha: 1,
                backgroundColor: chartColors['backgroundColor'],
                fillColors: chartColors['backgroundColor'],
                startDuration: 0.6,
                handDrawn: chartColors['handDrawn'],
                legend: {
                    equalWidths: false,
                    useGraphSettings: true,
                    valueAlign: 'left',
                    valueWidth: 60,
                    backgroundAlpha: 1,
                    backgroundColor: chartColors['backgroundColor'],
                    fillColors: chartColors['backgroundColor'],
                    valueFunction: function (graphDataItem) {
                        return graphDataItem && graphDataItem.graph && graphDataItem.graph.valueField && graphDataItem.values && graphDataItem.values.value ? (
                            graphDataItem.graph.valueField === 'ratio' ? (100 * graphDataItem.values.value).toFixed(2) + '%' : YTTGetDurationString({hours: graphDataItem.values.value})
                        ) : '';
                    }
                },
                dataProvider: datas,
                valueAxes: [{
                    id: 'durationAxis',
                    duration: 'hh',
                    durationUnits: {
                        DD: 'd',
                        hh: 'h ',
                        mm: 'min',
                        ss: 's'
                    },
                    guides: [{
                        value: YTTGetDurationAsHours(average['total']),
                        dashLength: 5,
                        above: false,
                        label: 'Opened avg.',
                        position: 'left',
                        lineThickness: 2,
                        inside: true
                    }, {
                        value: YTTGetDurationAsHours(average['real']),
                        dashLength: 5,
                        above: false,
                        label: 'Watched avg.',
                        position: 'left',
                        lineThickness: 2,
                        inside: true
                    }],
                    axisAlpha: 0.5,
                    gridAlpha: 0.2,
                    inside: true,
                    color: chartColors['labelColor'],
                    position: 'right',
                    title: 'Duration',
                    labelFrequency: 2,
                    labelFunction: function (value) {
                        return YTTGetDurationString({hours: value});
                    }
                }, {
                    id: 'ratioAxis',
                    minimum: 0,
                    //maximum: 1,
                    axisAlpha: 0,
                    gridAlpha: 0,
                    guides: [{
                        value: average['ratio'],
                        dashLength: 3,
                        above: false,
                        label: '',
                        lineThickness: 2,
                        inside: true
                    }],
                    labelsEnabled: false,
                    inside: false,
                    position: 'left',
                    title: '',
                    labelFrequency: 2,
                    labelFunction: function (value) {
                        return (100 * value).toFixed(2) + '%';
                    }
                }],
                graphs: [{
                    bullet: 'circle',
                    bulletBorderAlpha: 1,
                    bulletBorderThickness: 1,
                    dashLengthField: 'dashLength',
                    legendValueText: '[[value]]',
                    title: 'Opened time',
                    fillAlphas: 0.2,
                    valueField: 'total',
                    valueAxis: 'durationAxis',
                    type: 'smoothedLine',
                    lineThickness: 2,
                    bulletSize: 8,
                    balloonFunction: function (graphDataItem) {
                        return 'Opened<br>' + YTTGetDateString(graphDataItem.category.getTime()) + '<br><b><span style="font-size:14px;">' + YTTGetDurationString({hours: graphDataItem.values.value}) + '</span></b>';
                    }
                }, {
                    bullet: 'circle',
                    bulletBorderAlpha: 1,
                    bulletBorderThickness: 1,
                    dashLengthField: 'dashLength',
                    legendValueText: '[[value]]',
                    title: 'Watched time',
                    fillAlphas: 0.2,
                    valueField: 'real',
                    valueAxis: 'durationAxis',
                    type: 'smoothedLine',
                    lineThickness: 2,
                    bulletSize: 8,
                    balloonFunction: function (graphDataItem) {
                        return 'Watched<br>' + YTTGetDateString(graphDataItem.category.getTime()) + '<br><b><span style="font-size:14px;">' + YTTGetDurationString({hours: graphDataItem.values.value}) + '</span></b>';
                    }
                }, {
                    bullet: 'circle',
                    bulletAlpha: 0.5,
                    bulletBorderAlpha: 0.75,
                    bulletBorderThickness: 1,
                    dashLengthField: 'dashLength',
                    legendValueText: '[[value]]',
                    title: 'Ratio',
                    fillAlphas: 0,
                    valueField: 'ratio',
                    valueAxis: 'ratioAxis',
                    type: 'smoothedLine',
                    lineThickness: 1,
                    lineAlpha: 0.5,
                    bulletSize: 2,
                    balloonFunction: function (graphDataItem) {
                        return 'Ratio<br>' + YTTGetDateString(graphDataItem.category.getTime()) + '<br><b><span style="font-size:14px;">' + (100 * graphDataItem.values.value).toFixed(2) + '%' + '</span></b>';
                    }
                }],
                chartScrollbar: {
                    autoGridCount: true,
                    scrollbarHeight: 40,
                    listeners: [{
                        event: 'zoomed',
                        method: onChartZoomed
                    }],
                    selectedBackgroundColor: chartColors['selectedBackgroundColor'],
                    gridColor: chartColors['gridColor'],
                    color: chartColors['color'],
                    backgroundColor: chartColors['scrollBarBackgroundColor']
                },
                chartCursor: {
                    categoryBalloonDateFormat: 'YYYY-MM-DD',
                    cursorAlpha: 0.1,
                    cursorColor: '#000000',
                    fullWidth: true,
                    valueBalloonsEnabled: true,
                    zoomable: true,
                    listeners: [{
                        event: 'zoomed',
                        method: function (event) {
                            console.log(event);
                        }
                    }]
                },
                dataDateFormat: 'YYYY-MM-DD',
                categoryField: 'date',
                categoryAxis: {
                    dateFormats: [{
                        period: 'DD',
                        format: 'DD'
                    }, {
                        period: 'WW',
                        format: 'MMM DD'
                    }, {
                        period: 'MM',
                        format: 'MMM'
                    }, {
                        period: 'YYYY',
                        format: 'YYYY'
                    }],
                    minPeriod: 'DD',
                    parseDates: true,
                    autoGridCount: true,
                    axisColor: '#555555',
                    gridAlpha: 0.1,
                    gridColor: '#FFFFFF'
                },
                export: {
                    backgroundColor: chartColors['backgroundColor'],
                    enabled: true,
                    drawing: {
                        enabled: false
                    },
                    menu: []
                },
                responsive: {
                    enabled: true
                }
            });

            zoomChart();

            function updateCurrentInfos(datas) {
                var days = 0;
                var totalRatio = 0;
                var totalOpened = 0;
                var totalWatched = 0;
                var countTotal = 0;
                for (var key in datas) {
                    if (datas.hasOwnProperty(key)) {
                        var data = datas[key];
                        days += 1;
                        totalRatio += data['ratio'] || 0;
                        totalWatched += data['real'] || 0;
                        totalOpened += data['total'] || 0;
                        countTotal += data['count'] || 0;
                    }
                }
                $('#daysHolderSelect').text(days);
                $('#averageRatioHolderSelect').text((100 * (totalRatio / datas.length)).toFixed(2) + '%');
                $('#averageWatchedHolderSelect').text(YTTGetDurationString({hours: totalWatched / datas.length}));
                $('#averageOpenedHolderSelect').text(YTTGetDurationString({hours: totalOpened / datas.length}));
                $('#averageCountOpenedHolderSelect').text(average['count']);
                $('#totalWatchedHolderSelect').text(YTTGetDurationString({hours: totalWatched}));
                $('#totalOpenedHolderSelect').text(YTTGetDurationString({hours: totalOpened}));
                $('#totalCountOpenedHolderSelect').text(countTotal);
            }

            function onChartZoomed(event) {
                var datas = [];
                for (var i in event.chart.dataProvider) {
                    if (event.chart.dataProvider.hasOwnProperty(i)) {
                        var data = event.chart.dataProvider[i];
                        var parts = data['date'].split('-');
                        var date = new Date(parts[0], parts[1] - 1, parts[2]);
                        if (date.getTime() >= event.start && date.getTime() <= event.end) {
                            datas.push(data);
                        }
                    }
                }
                updateCurrentInfos(datas);
            }

            function zoomChart() {
                chart.zoomToIndexes(parsedConfigOrdered.length - 7, parsedConfigOrdered.length - 1);
                var datas = [];
                var raw = parsedConfigOrdered.slice(parsedConfigOrdered.length - 7, parsedConfigOrdered.length);
                for (var key in raw) {
                    if (raw.hasOwnProperty(key)) {
                        var dataRaw = raw[key];
                        var data = {};
                        if (YTTGetDurationAsMillisec(dataRaw['T']) === 0) {
                            data['ratio'] = 1;
                        }
                        else {
                            data['ratio'] = YTTGetDurationAsMillisec(dataRaw['R']) / YTTGetDurationAsMillisec(dataRaw['T']);
                        }
                        data['real'] = YTTGetDurationAsHours(dataRaw['R']);
                        data['total'] = YTTGetDurationAsHours(dataRaw['T']);
                        datas.push(data);
                    }
                }
                updateCurrentInfos(datas);
            }

            function dateFromDay(str) {
                var year = parseFloat(str.substring(str.length - 4));
                var day = parseFloat(str.substring(0, str.length - 4));
                var date = new Date(year, 0);
                date.setDate(day);
                return YTTGetDateString(date.getTime());
            }

            function buildData(config) {
                var data = [];
                for (var key in config) {
                    if (config.hasOwnProperty(key)) {
                        data.push({
                            date: dateFromDay(config[key]['day']),
                            real: YTTGetDurationAsHours(config[key]['R']),
                            total: YTTGetDurationAsHours(config[key]['T']),
                            ratio: YTTGetDurationAsMillisec(config[key]['T']) == 0 ? 1 : YTTGetDurationAsMillisec(config[key]['R']) / YTTGetDurationAsMillisec(config[key]['T'])
                        });
                    }
                }
                return data;
            }

            //Add interactions
            $('#exportJPGButton').click(function () {
                chart.export.capture({}, function () {
                    this.toJPG({}, function (base64) {
                        chrome.downloads.download({
                            url: base64,
                            filename: 'YTTExport.jpg'
                        });
                    });
                });
            });
            $('#exportPNGButton').click(function () {
                chart.export.capture({}, function () {
                    this.toPNG({}, function (base64) {
                        chrome.downloads.download({
                            url: base64,
                            filename: 'YTTExport.png'
                        });
                    });
                });
            });

            $('#averageRatioHolder').text((100 * average['ratio']).toFixed(2) + '%');
            $('#averageWatchedHolder').text(YTTGetDurationString(average['real']));
            $('#averageOpenedHolder').text(YTTGetDurationString(average['total']));
            $('#watchedHolder').text(YTTGetDurationString(config[YTTGetRealDayConfigKey]));
            $('#openedHolder').text(config[YTTGetCountDayConfigKey]  || 0);
            $('#versionNumber').text(config[YTT_CONFIG_VERSION] ? config[YTT_CONFIG_VERSION] : 'Unknown');
        });
    });
});
