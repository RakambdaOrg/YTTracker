function YTTHookProcess()
{
    var YTTPlayerTemp;
    if(yt && yt.player && yt.player.getPlayerByElement)
        YTTPlayerTemp = yt.player.getPlayerByElement('player-api')
    if(hookYTTPlayer(YTTPlayerTemp))
        setInterval(YTTUpdateDOM, 100);
    else
        setTimeout(YTTHookProcess, 200);
}

function YTTUpdateDOM(){
    document.getElementById(YTT_DOM_PLAYER_TIME_2).innerHTML = document.getElementById(YTT_DOM_PLAYER_TIME_1).innerHTML;
    document.getElementById(YTT_DOM_PLAYER_TIME_1).innerHTML = YTTGetPlayer().getCurrentTime();
}

YTTHookProcess();