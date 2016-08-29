chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg['action'] == 'alertPopup') {
        var videoTitle = document.getElementById('watch7-headline');
        var span = document.createElement('p');
        span.innerHTML = msg['message'];
        span.className = 'YTTInfo';
        videoTitle.parentNode.insertBefore(span, videoTitle);
    }
});

function YTTGetChangeState() {
    var values = $('#' + YTT_DOM_PLAYER_STATE).text().split(YTT_DOM_SPLITTER);
    var event = {};
    event[YTT_STATE_EVENT_STATE_KEY] = values[0];
    event[YTT_STATE_EVENT_TIME_KEY] = values[1];
    event[YTT_STATE_EVENT_VID_KEY] = $('#' + YTT_DOM_PLAYER_INFOS).text().split(YTT_DOM_SPLITTER)[0];
    YTTMessage(YTT_STATE_EVENT, event);
}

function YTTGetChangeInfos() {
    var values = $('#' + YTT_DOM_PLAYER_INFOS).text().split(YTT_DOM_SPLITTER);
    var event = {};
    event[YTT_DURATION_EVENT_ID_KEY] = values[0];
    event[YTT_DURATION_EVENT_DURATION_KEY] = values[1];
    YTTMessage(YTT_DURATION_EVENT, event);
}

/**
 * @return {string}
 */
function YTTGetInjectDiv(id, def) {
    return '<div id="' + id + '" style="display: none;">' + def + '</div>'
}

function injectCode() {
    var body = $("body");
    body.append(YTTGetInjectDiv(YTT_DOM_PLAYER_STATE, 0));
    body.append(YTTGetInjectDiv(YTT_DOM_PLAYER_INFOS, ''));
    body.append(YTTGetInjectDiv(YTT_DOM_PLAYER_TIME_1, 0));
    body.append(YTTGetInjectDiv(YTT_DOM_PLAYER_TIME_2, 0));

    $(window).on('beforeunload', function () {
        var event = {};
        event[YTT_STATE_EVENT_STATE_KEY] = 2;
        event[YTT_STATE_EVENT_TIME_KEY] = $('#' + YTT_DOM_PLAYER_TIME_2).text();
        YTTMessage(YTT_STATE_EVENT, event);
        return undefined;
    });

    var yttUtilsInj = document.createElement('script');
    var hookerUtilsInj = document.createElement('script');
    var hookerInj = document.createElement('script');
    var docFrag = document.createDocumentFragment();

    yttUtilsInj.type = 'text/javascript';
    yttUtilsInj.src = chrome.extension.getURL('js/YTTUtils.js');

    hookerUtilsInj.type = 'text/javascript';
    hookerUtilsInj.src = chrome.extension.getURL('js/hookerUtils.js');

    hookerInj.type = 'text/javascript';
    hookerInj.src = chrome.extension.getURL('js/hooker.js');

    docFrag.appendChild(yttUtilsInj);
    docFrag.appendChild(hookerUtilsInj);
    docFrag.appendChild(hookerInj);
    (document.head || document.documentElement).appendChild(docFrag);

    $('#' + YTT_DOM_PLAYER_STATE).bind("DOMSubtreeModified", function () {
        YTTGetChangeState();
    });

    $('#' + YTT_DOM_PLAYER_INFOS).bind("DOMSubtreeModified", function () {
        YTTGetChangeInfos();
    });

    YTTLog("Player hooked");
}

$(document).ready(injectCode);