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
    datas['datasets'] = [
        {
            borderColor: "rgba(255,136,0,1)",
            backgroundColor: "rgba(255,0,0,0.2)",
            pointBorderColor: "rgba(255,0,0,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            tension: 0.4,
            fill:true,
            label:'Playing time',
            data:[]
        },{
            borderColor: "rgba(50,255,0,1)",
            backgroundColor: "rgba(255,0,0,0.2)",
            pointBorderColor: "rgba(0,0,255,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            tension: 0.4,
            fill:true,
            label: 'Total time',
            data:[]
        }
    ];
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
            datas['datasets'][0]['data'].push(objects[object]['real']/parseFloat(60));
            datas['datasets'][1]['data'].push(objects[object]['total']/parseFloat(60));
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
    var opt = {
        tooltips:{
            callbacks:{
                label:function(tooltipItem, data) {return YTTGetDurationString({seconds:3600*tooltipItem['yLabel']});}
            }
        }
    };
    var div = $('#chartYTT');
    var chart = new Chart(div, {
        type: 'line',
        data: data,
        options: opt
    });
}