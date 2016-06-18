$(document).ready(function(){
    //Resize chart to fit height
    var chartHolder = document.getElementById('chartHolder');
    var chartdiv = document.getElementById('chartdiv');
    new ResizeSensor(chartHolder, function(){chartdiv.style.height = '' + chartHolder.clientHeight + 'px';});

    AmCharts.ready(function(){
        chrome.storage.sync.get(null, function (config){
            //Get days from config
            const parsedConfig = {};
            var minDate = '19999';
            var maxDate = '0';
            for(var key in config){
                if(config.hasOwnProperty(key) && key.substring(0, 3) == 'day'){
                    var day = key.substring(3, key.length - 1);
                    if(!parsedConfig[day]){
                        parsedConfig[day] = {R: 0, T: 0};
                    }
                    parsedConfig[day][key.substring(key.length - 1)] = config[key];
                    if(YTTCompareConfigDate(minDate, day) < 0){
                        minDate = day;
                    }
                    if(YTTCompareConfigDate(maxDate, day) > 0){
                        maxDate = day;
                    }
                }
            }
            //Add missing dates
            var current = minDate;
            var i = 0;
            var getNextConfigDate = function(date){
                var year = parseFloat(date.substring(date.length - 4));
                var days = parseFloat(date.substring(0, date.length - 4));
                var dateObj = new Date(year, 0);
                dateObj.setDate(days + 1);
                return YTTGetDayConfigKey(dateObj).substr(3);
            };
            while(YTTCompareConfigDate(maxDate, current) < 0 && i < 365 * 10){
                i++;
                current = getNextConfigDate(current);
                if(!parsedConfig.hasOwnProperty(current)){
                    parsedConfig[current] = {R: 0, T: 0};
                }
            }
            //Reorder dates
            const parsedConfigOrdered = [];
            Object.keys(parsedConfig).sort(function(a, b){
                return YTTCompareConfigDate(b, a);
            }).forEach(function(key){
                var conf = parsedConfig[key];
                conf['day'] = key;
                parsedConfigOrdered.push(conf);
            });

            var datas = buildData(parsedConfigOrdered);

            //Build Chart
            function getAverages(list){
                var totalR = 0;
                var totalT = 0;
                var totalRatio = 0;
                for(var key in list){
                    if(list.hasOwnProperty(key)){
                        totalR += YTTGetDurationAsMillisec({hours: list[key]['real']});
                        totalT += YTTGetDurationAsMillisec({hours: list[key]['total']});
                        totalRatio += list[key]['ratio'];
                    }
                }
                return {real: totalR / list.length, total: totalT / list.length, ratio: totalRatio / list.length};
            }

            var avgs = getAverages(datas);
            var average = {
                real: {milliseconds: avgs['real']},
                total: {milliseconds: avgs['total']},
                ratio: avgs['ratio']
            };

            var chart = AmCharts.makeChart(chartdiv, {
                type: 'serial',
                theme: 'light',
                startDuration: 0.6,
                legend: {
                    equalWidths: false,
                    useGraphSettings: true,
                    valueAlign: 'left',
                    valueWidth: 60,
                    valueFunction: function(graphDataItem){return graphDataItem && graphDataItem.graph && graphDataItem.graph.valueField && graphDataItem.values && graphDataItem.values.value ? (
                        graphDataItem.graph.valueField === 'ratio' ? (100 * graphDataItem.values.value).toFixed(2) + '%' : YTTGetDurationString({hours: graphDataItem.values.value})
                    ) : '';}
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
                        lineThickness: 2,
                        inside: true
                    }, {
                        value: YTTGetDurationAsHours(average['real']),
                        dashLength: 5,
                        above: false,
                        label: 'Watched avg.',
                        lineThickness: 2,
                        inside: true
                    }],
                    axisAlpha: 0.5,
                    gridAlpha: 0.2,
                    inside: false,
                    position: 'left',
                    title: 'Duration',
                    labelFrequency: 2,
                    labelFunction: function(value){return YTTGetDurationString({hours: value});}
                },{
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
                    labelFunction: function(value){return (100 * value).toFixed(2) + '%';}
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
                    balloonFunction: function(graphDataItem){return 'Opened<br>' + YTTGetDateString(graphDataItem.category.getTime()) + '<br><b><span style="font-size:14px;">' + YTTGetDurationString({hours: graphDataItem.values.value}) + '</span></b>';}
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
                    balloonFunction: function(graphDataItem){return 'Watched<br>' + YTTGetDateString(graphDataItem.category.getTime()) + '<br><b><span style="font-size:14px;">' + YTTGetDurationString({hours: graphDataItem.values.value}) + '</span></b>';}
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
                    balloonFunction: function(graphDataItem){return 'Ratio<br>' + YTTGetDateString(graphDataItem.category.getTime()) + '<br><b><span style="font-size:14px;">' + (100 * graphDataItem.values.value).toFixed(2) + '%' + '</span></b>';}
                }],
                chartScrollbar: {
                    autoGridCount: true,
                    scrollbarHeight: 40
                },
                chartCursor: {
                    categoryBalloonDateFormat: 'YYYY-MM-DD',
                    cursorAlpha: 0.1,
                    cursorColor: '#000000',
                    fullWidth: true,
                    valueBalloonsEnabled: true,
                    zoomable: true
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
                    enabled: true,
                    menu: []
                },
                responsive: {
                    enabled: true
                }
            });

            zoomChart();

            function zoomChart(){chart.zoomToIndexes(parsedConfigOrdered.length - 40, parsedConfigOrdered.length - 1);}

            function dateFromDay(str){
                var year = parseFloat(str.substring(str.length - 4));
                var day = parseFloat(str.substring(0, str.length - 4));
                var date = new Date(year, 0);
                date.setDate(day);
                return YTTGetDateString(date.getTime());
            }

            function buildData(config){
                var data = [];
                for(var key in config){
                    if(config.hasOwnProperty(key)){
                        data.push({
                            date: dateFromDay(config[key]['day']),
                            real: YTTGetDurationAsHours(config[key]['R']),
                            total: YTTGetDurationAsHours(config[key]['T']),
                            ratio: YTTGetDurationAsMinutes(config[key]['T']) == 0 ? 1 : YTTGetDurationAsMinutes(config[key]['R'])/YTTGetDurationAsMinutes(config[key]['T'])
                        });
                    }
                }
                return data;
            }

            //Add interactions
            $('#exportButton').click(function(){
                chrome.downloads.download({
                    url: 'data:application/json;base64,' + btoa(JSON.stringify(parsedConfig)),
                    filename: 'YTTExport.json'
                });
            });

            $('#exportJPGButton').click(function(){
                chart.export.capture({}, function(){
                    this.toJPG({}, function(base64){
                        chrome.downloads.download({
                            url: base64,
                            filename: 'YTTExport.jpg'
                        });
                    });
                });
            });
            $('#exportPNGButton').click(function(){
                chart.export.capture({}, function(){
                    this.toPNG({}, function(base64){
                        chrome.downloads.download({
                            url: base64,
                            filename: 'YTTExport.png'
                        });
                    });
                });
            });


            $('#importButton').change(function(event){
                var file = event.target.files[0];
                if(file){
                    var reader = new FileReader();
                    reader.onload = function(reader){
                        var importData = function(data){
                            var dataObject;
                            try{
                                dataObject = JSON.parse(data);
                            }
                            catch(err){
                                alert("Corrupted file!");
                                return;
                            }
                            if(!confirm("Be careful, if a day is already saved, it will be replaced by the one in the imported file!\nAre you sure to continue?")) {
                                return;
                            }
                            var config = {};
                            for(var key in dataObject){
                                if (dataObject.hasOwnProperty(key)){
                                    config['day' + key + 'R'] = dataObject[key]['R'];
                                    config['day' + key + 'T'] = dataObject[key]['T'];
                                }
                            }
                            chrome.storage.sync.set(config);
                            location.reload();
                        };
                        importData(reader.target.result);
                    };
                    reader.readAsText(file);
                }
            });

            $('#averageRatioHolder').text((100 * average['ratio']).toFixed(2) + '%');
            $('#averageWatchedHolder').text(YTTGetDurationString(average['real']));
            $('#averageOpenedHolder').text(YTTGetDurationString(average['total']));
            var REAL_TODAY_KEY = YTTGetRealDayConfigKey();
            chrome.storage.sync.get([REAL_TODAY_KEY], function(result){
                $('#watchedHolder').text(YTTGetDurationString(result[REAL_TODAY_KEY]));
            });
        });
    });
});
