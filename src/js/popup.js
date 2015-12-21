$(document).ready(function() {
    $("#reset").click(function(){
        chrome.storage.sync.set({
            'YTT_TotalTime': null,
            'YTT_IDS': [],
            'YTT_Start': null,
            'YTT_RealTime': null
        });
        message('RESETED STATS');
        showValue();
    });

    showValue();
});

function message(text){
    chrome.runtime.sendMessage({
        type: 'log',
        value: text
    });
}

function getDurationTime(duration) {
    if(!duration)
    {
        return '0S';
    }
    var text = '';

    if(duration.days)
    {
        text += duration.days + 'D ';
    }
    if(duration.hours)
    {
        text += duration.hours + 'H ';
    }
    if(duration.minutes)
    {
        text += duration.minutes + 'M ';
    }
    if(duration.seconds)
    {
        text += duration.seconds + 'S';
    }
    return text;
}

function getStartDate(time) {
    if(!time)
    {
        return '?';
    }
    var date = new Date(time);
    return date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}

function showValue()
{
    message('UPDATING PRINTED VALUE');
    chrome.storage.sync.get(['YTT_TotalTime', 'YTT_Start', 'YTT_RealTime'], function (result) {
        $("#duration").text(getDurationTime(result.YTT_TotalTime));
        $("#realduration").text(getDurationTime(result.YTT_RealTime));
        $("#start").text(getStartDate(result.YTT_Start));
    });
}
