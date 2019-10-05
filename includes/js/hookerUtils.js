let YTTHooked = false;
let YTTPlayer;

/**
 * Update the player state in the DOM.
 * @param event The event of the player (player status).
 */
function changeDOMTime(event) {
	if (event === 1)
		document.getElementById(YTT_DOM_PLAYER_STATE).innerHTML = YTT_STATE_EVENT_STATE_KEY_PLAYING + YTT_DOM_SPLITTER + YTTGetPlayer().getCurrentTime();
	else if(event === 2 || event === 0 || event === -5 || event === 3)
		document.getElementById(YTT_DOM_PLAYER_STATE).innerHTML = YTT_STATE_EVENT_STATE_KEY_WATCHED + YTT_DOM_SPLITTER + document.getElementById(YTT_DOM_PLAYER_TIME_2).innerHTML;
	else
		document.getElementById(YTT_DOM_PLAYER_STATE).innerHTML = 'unknown(' + event + ')' + YTT_DOM_SPLITTER + document.getElementById(YTT_DOM_PLAYER_TIME_2).innerHTML;
}

/**
 * Update the video infos in the DOM.
 */
function changeDOMInfos() {
	document.getElementById(YTT_DOM_PLAYER_INFOS).innerHTML = YTTPlayer.getVideoData()['video_id'] + YTT_DOM_SPLITTER + YTTPlayer.getDuration();
}

/**
 * Called when the video changes.
 */
function changeVideo() {
	if (YTTGetPlayer().getVideoData && YTTGetPlayer().getVideoData()['video_id'] !== (document.getElementById(YTT_DOM_PLAYER_INFOS).innerHTML.split(YTT_DOM_SPLITTER)[0] || '') && YTTGetPlayer().getCurrentTime && YTTGetPlayer().getDuration) {
		changeDOMTime(-5);
		changeDOMInfos();
	}
}

/**
 * Get the current hooked player.
 * @returns {*}
 */
function YTTGetPlayer() {
	return YTTPlayer;
}

/**
 * Try to hook a YouTube player.
 * @param player The player to hook.
 * @returns {boolean} True if successfull, false otherwise.
 */
function hookYTTPlayer(player) {
	if (YTTHooked || typeof player !== 'object' || !(player.getCurrentTime || player.getVideoData || player.getDuration || player.getPlayerState))
		return false;
	YTTLog('Player hooked');
	YTTHooked = true;
	YTTPlayer = player;
	document.getElementById(YTT_DOM_PLAYER_TIME_1).innerHTML = YTTPlayer.getCurrentTime();
	document.getElementById(YTT_DOM_PLAYER_TIME_2).innerHTML = YTTPlayer.getCurrentTime();
	changeDOMInfos();
	changeDOMTime(YTTPlayer.getPlayerState());
	YTTPlayer.addEventListener('onStateChange', changeDOMTime);
	YTTPlayer.addEventListener('onApiChange', changeVideo);
	return true;
}
