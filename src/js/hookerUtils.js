var YTTHooked = false;
var YTTPlayer;

function changeDOMTime(event){
    document.getElementById(YTT_DOM_PLAYER_STATE).innerHTML = event + YTT_DOM_SPLITTER + document.getElementById(YTT_DOM_PLAYER_TIME_2).innerHTML;
}

function changeDOMInfos(event){
    document.getElementById(YTT_DOM_PLAYER_INFOS).innerHTML = event[YTT_DURATION_EVENT_ID_KEY] + YTT_DOM_SPLITTER + event[YTT_DURATION_EVENT_DURATION_KEY];
}

function changeVideo() {
    if(YTTGetPlayer().getVideoData && YTTGetPlayer().getVideoData()['video_id'] != (document.getElementById(YTT_DOM_PLAYER_INFOS).innerHTML.split(YTT_DOM_SPLITTER)[0] || '') && YTTGetPlayer().getCurrentTime && YTTGetPlayer().getDuration) {
        changeDOMTime(2);
        var event = {};
        event[YTT_DURATION_EVENT_ID_KEY] = YTTPlayer.getVideoData()['video_id'];
        event[YTT_DURATION_EVENT_DURATION_KEY] = YTTPlayer.getDuration();
        changeDOMInfos(event);
        YTTLog('Player rehooked');
    }
}

function YTTGetPlayer(){
    return YTTPlayer;
}

function hookYTTPlayer(player)
{
    if(YTTHooked || typeof player !== 'object' || !(player.getCurrentTime || player.getVideoData || player.getDuration))
        return false;
    YTTLog("Player hooked");
    YTTHooked = true;
    YTTPlayer = player;
    document.getElementById(YTT_DOM_PLAYER_TIME_1).innerHTML = YTTPlayer.getCurrentTime();
    document.getElementById(YTT_DOM_PLAYER_TIME_2).innerHTML = YTTPlayer.getCurrentTime();
    var baseInfos = {};
    baseInfos[YTT_DURATION_EVENT_ID_KEY] = YTTPlayer.getVideoData()['video_id'];
    baseInfos[YTT_DURATION_EVENT_DURATION_KEY] = YTTPlayer.getDuration();
    changeDOMInfos(baseInfos);
    changeDOMTime(YTTPlayer.getPlayerState());
    YTTPlayer.addEventListener('onStateChange', changeDOMTime);
    YTTPlayer.addEventListener('onApiChange', changeVideo);
    return true;
}
