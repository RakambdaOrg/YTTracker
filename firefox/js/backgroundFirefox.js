//noinspection JSCheckFunctionSignatures
chrome.runtime.onMessage.addListener(function (request, sender) {
	if (request[YTT_MESSAGE_TYPE_KEY] === YTT_LOG_EVENT) {
		log(request[YTT_MESSAGE_VALUE_KEY] || 'undefined');
	}
	else if (request[YTT_MESSAGE_TYPE_KEY] === YTT_STATE_EVENT) {
		request[YTT_MESSAGE_VALUE_KEY][YTT_STATE_EVENT_ID_KEY] = sender.tab.id;
		playerStateChange(request[YTT_MESSAGE_VALUE_KEY]);
	}
	else if (request[YTT_MESSAGE_TYPE_KEY] === YTT_DURATION_EVENT) {
		request[YTT_MESSAGE_VALUE_KEY][YTT_DURATION_EVENT_TABID_KEY] = sender.tab.id;
		setVideoDuration(request[YTT_MESSAGE_VALUE_KEY]);
	}
});
