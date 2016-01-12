function YTTHookProcess()
{
    var hooked = false;
    try {
        var YTTPlayerTemp;
        if (yt && yt.player && yt.player.getPlayerByElement)
            YTTPlayerTemp = yt.player.getPlayerByElement('player-api')
        if (YTTPlayerTemp && hookYTTPlayer)
            hooked = hookYTTPlayer(YTTPlayerTemp);
    }
    catch (err){
    }
    if(hooked)
        YTTUpdateDOM();
    else
        setTimeout(YTTHookProcess, 250);
}

function YTTUpdateDOM(){
    var YTTTempPlayer = YTTGetPlayer();
    if(YTTTempPlayer && YTTTempPlayer.getCurrentTime && YTTTempPlayer.getCurrentTime())
    {
        document.getElementById(YTT_DOM_PLAYER_TIME_2).innerHTML = document.getElementById(YTT_DOM_PLAYER_TIME_1).innerHTML;
        document.getElementById(YTT_DOM_PLAYER_TIME_1).innerHTML = YTTTempPlayer.getCurrentTime();
    }
}

YTTHookProcess();