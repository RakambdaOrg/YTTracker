function onYouTubePlayerReady(player){
    setTimeout(function(){
        hookYTTPlayer(player);
        setInterval(function(){
            document.getElementById('YTTPlayerTime2').innerHTML = document.getElementById('YTTPlayerTime').innerHTML;
            document.getElementById('YTTPlayerTime').innerHTML = YTTPlayer.getCurrentTime();
        }, 100);
    }, 500);
}