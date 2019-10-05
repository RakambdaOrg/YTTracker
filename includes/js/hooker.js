/**
 * Setup hook onto the YouTube player.
 */
function YTTHookProcess() {
	const RETRY_DELAY = 250;
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
		setTimeout(YTTHookProcess, RETRY_DELAY);
}

/**
 * Called when the hook is successfull and start a scheduled task to update current player time continuously.
 */
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