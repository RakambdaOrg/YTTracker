//noinspection JSUnusedGlobalSymbols
function performCommand(event) {
	if (event.command === 'yttracker-button') {
		const newTab = safari.application.activeBrowserWindow.openTab();
		newTab.url = 'https://yttracker.mrcraftcod.fr/';
	}
}

//noinspection JSUnusedGlobalSymbols
function handleMessage(msg) {
	if (msg.name === 'YTTracker') {
		const request = msg.message;
		if (request[YTT_MESSAGE_TYPE_KEY] === YTT_LOG_EVENT) {
			log(request[YTT_MESSAGE_VALUE_KEY] || 'undefined');
		}
		else if (request[YTT_MESSAGE_TYPE_KEY] === YTT_STATE_EVENT) {
			request[YTT_MESSAGE_VALUE_KEY][YTT_STATE_EVENT_ID_KEY] = msg.target.url;
			playerStateChange(request[YTT_MESSAGE_VALUE_KEY]);
		}
		else if (request[YTT_MESSAGE_TYPE_KEY] === YTT_DURATION_EVENT) {
			request[YTT_MESSAGE_VALUE_KEY][YTT_DURATION_EVENT_TABID_KEY] = msg.target.url;
			setVideoDuration(request[YTT_MESSAGE_VALUE_KEY]);
		}
	}
}

safari.application.addEventListener('command', performCommand, false);
