/**
 * Setup hook onto the YouTube player.
 */
function YTTHookProcess(policy, attempt) {
	const RETRY_DELAY = 250;
	const MAX_ATTEMPT = 500;
	let hooked = false;
	try {
		console.debug('Trying to hook to player');
		let YTTPlayerTemp;
		YTTPlayerTemp = document.getElementById('movie_player');
		if (YTTPlayerTemp && hookYTTPlayer) {
			hooked = hookYTTPlayer(YTTPlayerTemp, policy);
		}
	} catch (ignored) {
	}
	if (hooked) {
		YTTUpdateDOM(policy);
	} else if (attempt < MAX_ATTEMPT) {
		setTimeout(() => YTTHookProcess(policy, attempt + 1), RETRY_DELAY);
	}
}

/**
 * Called when the hook is successfull and start a scheduled task to update current player time continuously.
 */
function YTTUpdateDOM(policy) {
	setInterval(() => {
		const YTTTempPlayer = YTTGetPlayer();
		if (YTTTempPlayer && YTTTempPlayer.getCurrentTime && YTTTempPlayer.getCurrentTime()) {
			const temp1 = document.getElementById(YTT_DOM_PLAYER_TIME_1).innerHTML;
			const now = YTTTempPlayer.getCurrentTime();
			document.getElementById(YTT_DOM_PLAYER_TIME_2).innerHTML = policy ? policy.createHTML(temp1) : temp1;
			document.getElementById(YTT_DOM_PLAYER_TIME_1).innerHTML = policy ? policy.createHTML(now) : now;
		}
	}, 75);
}

if (window.trustedTypes && window.trustedTypes.createPolicy) {
	ytTrackerPolicy = window.trustedTypes.createPolicy('ytTrackerPolicy', {
		createHTML: (to_escape) => to_escape
	});
	YTTHookProcess(ytTrackerPolicy, 0);
} else {
	YTTHookProcess(null, 0);
}

