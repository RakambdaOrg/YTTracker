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
        plot(parseData(dataObject));
    });
});

function parseData(dataObject){
    var datas = {};
    datas['labels'] = [];
    datas['series'] = [[],[],[]];
    for (var key in dataObject)
        if (dataObject.hasOwnProperty(key)){
            datas['labels'].push(dateFromDay(key));
            datas['series'][0].push(YTTGetDurationAsMinutes(dataObject[key]['R']));
            datas['series'][1].push(YTTGetDurationAsMinutes(dataObject[key]['T']));
            datas['series'][2].push(parseFloat(YTTGetDurationAsMinutes(dataObject[key]['R'])) / YTTGetDurationAsMinutes(dataObject[key]['T']));
        }
    var maxValue = getMaxValue(datas['series'][1]);
    datas['series'][2].forEach(function(data, index, array){
        datas['series'][2][index] = data * maxValue;
    });
    return datas;
}

function dateFromDay(str){
    var year = parseFloat(str.substring(str.length - 4));
    var day = parseFloat(str.substring(0, str.length - 4));
    var date = new Date(year, 0);
    date.setDate(day);
    return ("0" + date.getDate()).slice(-2) + "-" + ("0"+(date.getMonth()+1)).slice(-2) + "-" + date.getFullYear();
}

function getMaxValue(datas){
    var val = -9999999999999999999999;
    datas.forEach(function(data){
        if(data && data > val)
            val = data;
    });
    return val;
}

function plot(data){
    var chart = new Chartist.Line('#chartYTT', data, {
        width: '100%',
        height: '60%',
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
            }),
            Chartist.plugins.ctPointLabels({
                textAnchor: 'middle',
                labelInterpolationFnc: function(value) {return YTTGetDurationString({minutes:value});}
            })
        ]
    });
    var seq = 0;
    chart.on('created', function() {
        seq = 0;
    });
    chart.on('draw', function(data) {
        if(data.type === 'point' || data.type === 'line') {
            data.element.animate({
                opacity: {
                    begin: seq++ * 80,
                    dur: 500,
                    from: 0,
                    to: 1
                },
                x1: {
                    begin: seq++ * 80,
                    dur: 500,
                    from: data.x - 100,
                    to: data.x,
                    easing: Chartist.Svg.Easing.easeOutQuart
                }
            });
        }
    });


}