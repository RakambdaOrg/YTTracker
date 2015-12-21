var hooked = false;
var YTTPlayer;

function changeDOMTime(event) {
    document.getElementById('YTTPlayer').innerHTML = event + '@' + document.getElementById('YTTPlayerTime2').innerHTML;
}

function changeDOMInfos(event) {
    document.getElementById('YTTPlayerInfos').innerHTML = event.ID + '@' + event.duration;
}

function log(text){
    message('log', text);
}

function message(type, text){
    chrome.runtime.sendMessage({
        type: type,
        value: text
    });
}

function hookYTTPlayer(player)
{
    if(hooked || typeof player !== 'object')
        return;
    log("Player hooked");
    hooked = true;
    YTTPlayer = player;
    document.getElementById('YTTPlayerTime').innerHTML = YTTPlayer.getCurrentTime();
    document.getElementById('YTTPlayerTime2').innerHTML = YTTPlayer.getCurrentTime();
    changeDOMInfos({ID: YTTPlayer.getVideoData().video_id, duration: YTTPlayer.getDuration()});
    changeDOMTime(YTTPlayer.getPlayerState());
    YTTPlayer.addEventListener('onStateChange', changeDOMTime);
}