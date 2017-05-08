function YTTHookProcess() {
	let hooked = false;
	try {
		let YTTPlayerTemp;
		YTTPlayerTemp = document.getElementById('movie_player');
		if (YTTPlayerTemp && hookYTTPlayer)
			hooked = hookYTTPlayer(YTTPlayerTemp);
	}
	catch (ignored) {
	}
	if (hooked)
		YTTUpdateDOM();
	else
		setTimeout(YTTHookProcess, 250);
}

function YTTUpdateDOM() {
	setInterval(function () {
		const YTTTempPlayer = YTTGetPlayer();
		if (YTTTempPlayer && YTTTempPlayer.getCurrentTime && YTTTempPlayer.getCurrentTime()) {
			document.getElementById(YTT_DOM_PLAYER_TIME_2).innerHTML = document.getElementById(YTT_DOM_PLAYER_TIME_1).innerHTML;
			document.getElementById(YTT_DOM_PLAYER_TIME_1).innerHTML = YTTTempPlayer.getCurrentTime();
		}
	}, 75);
}

YTTHookProcess();