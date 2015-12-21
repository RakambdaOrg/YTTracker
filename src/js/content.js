function message(type, text){
    chrome.runtime.sendMessage({
        type: type,
        value: text
    });
}

function getChangeState()
{
    var values = $('#YTTPlayer').text().split('@');
    change('playerChange', {state:values[0], time:values[1]});
}

function getChangeInfos()
{
    var values = $('#YTTPlayerInfos').text().split('@');
    change('playerDuration', {ID:values[0], duration:values[1]});
}

function change(type, event){
    message(type, event);
}

function injectCode() {
    var body = $("body");
    body.append('<div id="YTTPlayer" style="display: none;">0</div>');
    body.append('<div id="YTTPlayerInfos" style="display: none;"></div>');
    body.append('<div id="YTTPlayerTime" style="display: none;">0</div>');
    body.append('<div id="YTTPlayerTime2" style="display: none;">0</div>');

    $(window).on('unload', function(){
        change({state:2, time:$('#YTTPlayerTime2').text()});
    });

    var utilsInj = document.createElement('script');
    var hookerInj = document.createElement('script');
    var docFrag = document.createDocumentFragment();

    utilsInj.type = "text/javascript";
    utilsInj.src = chrome.extension.getURL('js/utils.js');

    hookerInj.type = "text/javascript";
    hookerInj.src = chrome.extension.getURL('js/hooker.js');

    docFrag.appendChild(utilsInj);
    docFrag.appendChild(hookerInj);
    (document.head || document.documentElement).appendChild(docFrag);

    $('#YTTPlayer').bind("DOMSubtreeModified", function () {
        getChangeState();
    });

    $('#YTTPlayerInfos').bind("DOMSubtreeModified", function () {
        getChangeInfos();
    });

    message("log", "Player hooked");
}

$(document).ready(injectCode);