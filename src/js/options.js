$(document).ready(function(){
    chrome.storage.sync.get(null, function(config) {
        var dataObject = {};
        for (var key in config) {
            if (config.hasOwnProperty(key) && key.substring(0, 3) == 'day') {
                if (!dataObject[key.substring(3, key.length - 1)])
                    dataObject[key.substring(3, key.length - 1)] = {};
                dataObject[key.substring(3, key.length - 1)][key.substring(key.length - 1)] = config[key];
            }
        }
        var datas = parseData(dataObject);
        plot(datas);

        $('#exportButton').click(function(){
            var result = JSON.stringify(datas);
            var url = 'data:application/json;base64,' + btoa(result);
            chrome.downloads.download({
                url: url,
                filename: 'YTTExport.json'
            });
        });

        $('#importButton').change(function(event){
            var f = event.target.files[0];
            if(f)
            {
                var reader = new FileReader();
                reader.onload = function(e){importData(e.target.result);};
                reader.readAsText(f);
            }
        });

        $('#debugCheck').prop('checked', config[YTT_CONFIG_DEBUG_KEY]);
        $('#debugCheck').click(function(){
            var config = {};
            config[YTT_CONFIG_DEBUG_KEY] = $(this).is(':checked');
            chrome.storage.sync.set(config);
        });
    });
});

function importData(data) {
    var dataObject;
    try{
        dataObject = JSON.parse(data);
    }
    catch(err){
        alert("Corrupted file!");
        return;
    }
    if(!dataObject || !dataObject.labels || !dataObject.seriesLabels || !dataObject.series)
    {
        alert("Corrupted file!");
        return;
    }
    if(!confirm("Be careful, if a day is already saved, it will be replaced by the one in the imported file!\nAre you sure to continue?"))
        return;
    var config = {};
    var realIndex;
    var totalIndex;
    if(dataObject.seriesLabels[0][0] == 'T')
    {
        totalIndex = 0;
        realIndex = 1;
    }
    else
    {
        totalIndex = 1;
        realIndex = 0;
    }
    for(var dateIndex = 0; dateIndex < dataObject.labels.length; dateIndex++)
    {
        var dateElements = dataObject.labels[dateIndex].split('-');
        var dateObj = new Date(dateElements[2], parseInt(dateElements[1]) - 1, dateElements[0]);
        console.log(dateObj);
        config[YTTGetRealDayConfigKey(dateObj)] = {minutes:dataObject.series[realIndex][dateIndex]};
        config[YTTGetTotalDayConfigKey(dateObj)] = {minutes:dataObject.series[totalIndex][dateIndex]};
    }
    chrome.storage.sync.set(config);
    location.reload();
}

function parseData(dataObject){
    var objects = [];
    var datas = {};
    datas['labels'] = [];
    datas['seriesLabels'] = ['Playing time', 'Total time'];
    datas['series'] = [[],[]];
    for (var key in dataObject)
        if (dataObject.hasOwnProperty(key))
            objects.push({key:dateFromDay(key), real: YTTGetDurationAsMinutes(dataObject[key]['R']), total: YTTGetDurationAsMinutes(dataObject[key]['T'])});
    objects.sort(function(a, b){
        return getDateFromTime(a['key']).getTime() - getDateFromTime(b['key']).getTime();
    });
    for(var object in objects)
        if(objects.hasOwnProperty(object))
        {
            datas['labels'].push(objects[object]['key']);
            datas['series'][0].push(objects[object]['real']);
            datas['series'][1].push(objects[object]['total']);
        }
    return datas;
}

function getDateFromTime(time){
    var parts = time.split('-');
    return new Date(parts[2], parts[1], parts[0]);
}

function dateFromDay(str){
    var year = parseFloat(str.substring(str.length - 4));
    var day = parseFloat(str.substring(0, str.length - 4));
    var date = new Date(year, 0);
    date.setDate(day);
    return ("0" + date.getDate()).slice(-2) + "-" + ("0"+(date.getMonth()+1)).slice(-2) + "-" + date.getFullYear();
}

function plot(data){
    var chart = new Chartist.Line('#chartYTT', data, {
        height: 600,
        showArea: true,
        fullWidth: true,
        lineSmooth: Chartist.Interpolation.simple({
            divisor: 2
        }),
        chartPadding: {
            right: 100,
            top: 20,
            left: 10
        },
        plugins: [
            Chartist.plugins.ctAxisTitle({
                axisX:{
                    axisTitle: 'Date',
                    axisClass: 'ct-axis-title',
                    offset: {
                        x: 0,
                        y: 35
                    }
                },
                axisY: {
                    axisTitle: 'Time (minutes)',
                    axisClass: 'ct-axis-title',
                    offset: {
                        x: 0,
                        y: 0
                    },
                    flipTitle: false
                }
            })
        ]
    });
    var seq = 0;
    var delays = 80;
    var durations = 500;
    chart.on('created', function() {
        seq = 0;
    });
    chart.on('draw', function(dataEvent) {
        if(dataEvent.type === 'line' || dataEvent.type === 'area') {
            dataEvent.element.animate({
                opacity: {
                    begin: seq++ * 80,
                    dur: 500,
                    from: 0,
                    to: 1
                },
                x1: {
                    begin: seq++ * 80,
                    dur: 500,
                    from: dataEvent.x - 100,
                    to: dataEvent.x,
                    easing: Chartist.Svg.Easing.easeOutQuart
                },
                d: {
                    begin: 2000 * dataEvent.index,
                    dur: 2000,
                    from: dataEvent.path.clone().scale(1, 0).translate(0, dataEvent.chartRect.height()).stringify(),
                    to: dataEvent.path.clone().stringify(),
                    easing: Chartist.Svg.Easing.easeOutQuint
                }
            });
        }
        else if(dataEvent.type === 'point') {
            if(dataEvent.index + 1 == dataEvent.series.length)
            {
                dataEvent.group.elem('text', {
                    x: dataEvent.x + 10,
                    y: dataEvent.y + 3,
                    id: "YTTLabel" + dataEvent['seriesIndex']
                }, 'ct-label-end').text(data['seriesLabels'][dataEvent['seriesIndex']]);
            }
            var newX = -15;
            var newY = 0;
            if(dataEvent.index == 0)
                newX += 15;
            else if(dataEvent.index + 1 == dataEvent.series.length)
                newX -= 30;
            if(dataEvent['seriesIndex'] == 0)
                newY = 20;
            else
                newY = -9;
            dataEvent.group.elem('text', {
                x: dataEvent.x + newX,
                y: dataEvent.y + newY
            }, 'ct-label').text(YTTGetDurationString({minutes:dataEvent.value.y}));
            dataEvent.element.animate({
                opacity: {
                    begin: seq++ * 80,
                    dur: 500,
                    from: 0,
                    to: 1
                },
                x1: {
                    begin: seq++ * 80,
                    dur: 500,
                    from: dataEvent.x - 100,
                    to: dataEvent.x,
                    easing: Chartist.Svg.Easing.easeOutQuart
                }
            });
        }
        else if(dataEvent.type === 'label' && dataEvent.axis === 'x') {
            dataEvent.element.animate({
                y: {
                    begin: seq * delays,
                    dur: durations,
                    from: dataEvent.y + 100,
                    to: dataEvent.y,
                    easing: 'easeOutQuart'
                }
            });
        }
        else if(dataEvent.type === 'label' && dataEvent.axis === 'y') {
            dataEvent.element.animate({
                x: {
                    begin: seq * delays,
                    dur: durations,
                    from: dataEvent.x - 100,
                    to: dataEvent.x,
                    easing: 'easeOutQuart'
                }
            });
        }
        else if(dataEvent.type === 'grid') {
            var pos1Animation = {
                begin: seq * delays,
                dur: durations,
                from: dataEvent[dataEvent.axis.units.pos + '1'] - 30,
                to: dataEvent[dataEvent.axis.units.pos + '1'],
                easing: 'easeOutQuart'
            };
            var pos2Animation = {
                begin: seq * delays,
                dur: durations,
                from: dataEvent[dataEvent.axis.units.pos + '2'] - 100,
                to: dataEvent[dataEvent.axis.units.pos + '2'],
                easing: 'easeOutQuart'
            };
            var animations = {};
            animations[dataEvent.axis.units.pos + '1'] = pos1Animation;
            animations[dataEvent.axis.units.pos + '2'] = pos2Animation;
            animations['opacity'] = {
                begin: seq * delays,
                dur: durations,
                from: 0,
                to: 1,
                easing: 'easeOutQuart'
            };
            dataEvent.element.animate(animations);
        }
    });
}