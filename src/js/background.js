var DEBUG = true;

var players = {};

function log(text) {
    console.log(text);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if(request.type == 'log') {
        if (DEBUG) {
            if (request.value) {
                log(request.value);
            }
        }
    }
    else if(request.type == 'playerChange')
    {
        request.value.ID = sender.tab.id;
        playerStateChange(request.value);
    }
    else if(request.type == 'playerDuration')
    {
        setVideoDuration(request.value)
    }
});

function playerStateChange(event) {
    if(event.state == 1)
    {
        log("Started playing at " + event.time + "s");
        players[event.ID] = event.time;
    }
    else if((event.state == 2 || event.state == 0) && players[event.ID] != null)
    {
        log("Ended playing at " + event.time + "s");
        var duration = {milliseconds: parseInt((event.time - players[event.ID]) * 1000)};
        players[event.ID] = null;
        chrome.storage.sync.get(['YTT_RealTime'], function (result){
            duration = addDurations(duration, result.YTT_RealTime);
            log("New real time: " + getDurationTime(duration));
            chrome.storage.sync.set({
                'YTT_RealTime': duration
            });
        });
    }
}

function addDurations(d1, d2) {
    if(!d1)
    {
        d1 = {};
    }
    if(!d2)
    {
        d2 = {};
    }
    var d = {
        milliseconds: 0,
        seconds: 0,
        minutes: 0,
        hours: 0,
        days: 0
    };

    d.milliseconds += (d1.milliseconds || 0) + (d2.milliseconds || 0);

    d.seconds += (d1.seconds || 0) + (d2.seconds  || 0) + parseInt(d.milliseconds / 1000);
    d.milliseconds %= 1000;

    d.minutes = (d1.minutes || 0) + (d2.minutes || 0) + parseInt(d.seconds / 60);
    d.seconds %= 60;

    d.hours = (d1.hours || 0) + (d2.hours || 0) + parseInt(d.minutes / 60);
    d.minutes %= 60;

    d.days = (d1.days || 0) + (d2.days || 0) + parseInt(d.hours / 24);
    d.hours %= 24;

    return d;
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

function setVideoDuration(event) {
    chrome.storage.sync.get(['YTT_IDS', 'YTT_Start', 'YTT_TotalTime'], function (result)
    {
        if (!result.YTT_IDS || result.YTT_IDS.indexOf(event.ID) === -1)
        {
            var IDS = result.YTT_IDS;
            if (!IDS)
                IDS = [];
            IDS.push(event.ID);
            var duration = addDurations({milliseconds: parseInt(event.duration * 1000)}, result.YTT_TotalTime);
            log("New time: " + getDurationTime(duration));
            chrome.storage.sync.set({
                'YTT_TotalTime': duration,
                'YTT_IDS': IDS,
                'YTT_Start': result.YTT_Start || new Date().getTime()
            });
        }
    });
}