function onYouTubePlayerReady(player){
    setTimeout(function(){
        hookYTTPlayer(player);
        setInterval(function(){
            document.getElementById(YTT_DOM_PLAYER_TIME_2).innerHTML = document.getElementById(YTT_DOM_PLAYER_TIME_1).innerHTML;
            document.getElementById(YTT_DOM_PLAYER_TIME_1).innerHTML = YTTGetPlayer().getCurrentTime();
        }, 100);
    }, 500);
}