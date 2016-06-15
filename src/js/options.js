$(document).ready(function () {
    var chartHolder = document.getElementById('chartHolder');
    new ResizeSensor(chartHolder, function() {
        document.getElementById('chartdiv').style.height = '' + chartHolder.clientHeight + 'px';
    });

    AmCharts.ready(function() {
        chrome.storage.sync.get(null, function (config) {
            const parsedConfig = {};
            var minDate = "19999";
            var maxDate = "0";
            for (var key in config) {
                if (config.hasOwnProperty(key) && key.substring(0, 3) == 'day') {
                    var day = key.substring(3, key.length - 1);
                    if (!parsedConfig[day]) {
                        parsedConfig[day] = {R: 0, T: 0};
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
                    parsedConfig[current] = {R: 0, T: 0};
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

            //Build Chart
            function getAverageWatched(list) {
                var total = 0;
                for (var key in list) {
                    if (list.hasOwnProperty(key)) {
                        total += YTTGetDurationAsMillisec(list[key]['R']);
                    }
                }
                return total / list.length;
            }

            var average = {milliseconds: getAverageWatched(parsedConfigOrdered)};

            var chart = AmCharts.makeChart("chartdiv", {
                "type": "serial",
                "theme": "light",
                startDuration: 0.6,
                "legend": {
                    "equalWidths": false,
                    "useGraphSettings": true,
                    "valueAlign": "left",
                    "valueWidth": 60,
                    "valueFunction": function (graphDataItem, graph) {
                        return graphDataItem && graphDataItem.values && graphDataItem.values.value ? YTTGetDurationString({hours: graphDataItem.values.value}) : '';
                    }
                },
                "dataProvider": buildData(parsedConfigOrdered),
                "valueAxes": [{
                    "id": "durationAxis",
                    "duration": "hh",
                    "durationUnits": {
                        "DD": "d",
                        "hh": "h ",
                        "mm": "min",
                        "ss": "s"
                    },
                    guides: [{
                        value: YTTGetDurationAsHours(average),
                        dashLength: 5
                    }],
                    "axisAlpha": 0.5,
                    "gridAlpha": 0.2,
                    "inside": false,
                    "position": "left",
                    "title": "Duration",
                    labelFrequency: 2,
                    labelFunction: function (a, b, c) {
                        return YTTGetDurationString({hours: a});
                    }
                }],
                "graphs": [{
                    "bullet": "circle",
                    "bulletBorderAlpha": 1,
                    "bulletBorderThickness": 1,
                    "dashLengthField": "dashLength",
                    "legendValueText": "[[value]]",
                    "title": "Opened time",
                    "fillAlphas": 0.2,
                    "valueField": "total",
                    "valueAxis": "durationAxis",
                    "type": "smoothedLine",
                    "lineThickness": 2,
                    "bulletSize": 8,
                    //"balloonText": "Opened<br>[[category]]<br><b><span style='font-size:14px;'>[[value]]</span></b>",
                    "balloonFunction": function (graphDataItem, graph) {
                        return "Opened<br>" + YTTGetDateString(graphDataItem.category.getTime()) + "<br><b><span style='font-size:14px;'>" + YTTGetDurationString({hours: graphDataItem.values.value}) + "</span></b>";
                    }
                }, {
                    "bullet": "circle",
                    "bulletBorderAlpha": 1,
                    "bulletBorderThickness": 1,
                    "dashLengthField": "dashLength",
                    "legendValueText": "[[value]]",
                    "title": "Watched time",
                    "fillAlphas": 0.2,
                    "valueField": "real",
                    "valueAxis": "durationAxis",
                    "type": "smoothedLine",
                    "lineThickness": 2,
                    "bulletSize": 8,
                    //"balloonText": "Watched<br>[[category]]<br><b><span style='font-size:14px;'>[[value]]</span></b>",
                    "balloonFunction": function (graphDataItem, graph) {
                        return "Watched<br>" + YTTGetDateString(graphDataItem.category.getTime()) + "<br><b><span style='font-size:14px;'>" + YTTGetDurationString({hours: graphDataItem.values.value}) + "</span></b>";
                    }
                }],
                "chartScrollbar": {
                    "autoGridCount": true,
                    "scrollbarHeight": 40
                },
                "chartCursor": {
                    "categoryBalloonDateFormat": "YYYY-MM-DD",
                    "cursorAlpha": 0.1,
                    "cursorColor": "#000000",
                    "fullWidth": true,
                    "valueBalloonsEnabled": true,
                    "zoomable": true
                },
                "dataDateFormat": "YYYY-MM-DD",
                "categoryField": "date",
                "categoryAxis": {
                    "dateFormats": [{
                        "period": "DD",
                        "format": "DD"
                    }, {
                        "period": "WW",
                        "format": "MMM DD"
                    }, {
                        "period": "MM",
                        "format": "MMM"
                    }, {
                        "period": "YYYY",
                        "format": "YYYY"
                    }],
                    "minPeriod": "DD",
                    "parseDates": true,
                    "autoGridCount": true,
                    "axisColor": "#555555",
                    "gridAlpha": 0.1,
                    "gridColor": "#FFFFFF"
                },
                "export": {
                    "enabled": true,
                    menu: []
                },
                "responsive": {
                    "enabled": true
                }
            });

            zoomChart();

            function zoomChart() {
                chart.zoomToIndexes(parsedConfigOrdered.length - 40, parsedConfigOrdered.length - 1);
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
                var i = 0;
                for (var key in config) {
                    if (i > 200)
                        break;
                    i++;
                    if (config.hasOwnProperty(key)) {
                        data.push({
                            "date": dateFromDay(config[key]['day']),
                            "real": YTTGetDurationAsHours(config[key]['R']),
                            "total": YTTGetDurationAsHours(config[key]['T'])
                        });
                    }
                }
                return data;
            }

            //Add interactions
            $('#exportButton').click(function () {
                chrome.downloads.download({
                    url: 'data:application/json;base64,' + btoa(JSON.stringify(parsedConfig)),
                    filename: 'YTTExport.json'
                });
            });

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


            $('#importButton').change(function (event) {
                var f = event.target.files[0];
                if (f) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var importData = function (data) {
                            var dataObject;
                            try {
                                dataObject = JSON.parse(data);
                            }
                            catch (err) {
                                alert("Corrupted file!");
                                return;
                            }
                            if (!confirm("Be careful, if a day is already saved, it will be replaced by the one in the imported file!\nAre you sure to continue?"))
                                return;
                            var config = {};
                            for (var key in dataObject)
                                if (dataObject.hasOwnProperty(key)) {
                                    config['day' + key + 'R'] = dataObject[key]['R'];
                                    config['day' + key + 'T'] = dataObject[key]['T'];
                                }

                            chrome.storage.sync.set(config);
                            location.reload();
                        };

                        importData(e.target.result);
                    };
                    reader.readAsText(f);
                }
            });

            $('#averageHolder').text(YTTGetDurationString(average));
            var REAL_TODAY_KEY = YTTGetRealDayConfigKey();
            chrome.storage.sync.get([REAL_TODAY_KEY], function (result) {
                $('#watchedHolder').text(YTTGetDurationString(result[REAL_TODAY_KEY]));
            });
        });
    });
});
