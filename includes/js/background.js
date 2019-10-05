'use strict';

const activePlayers = {};

/**
 * Init config.
 */
YTTGetConfig(null, function (conf) {
	const newConfig = {};

	if (!conf[YTT_CONFIG_USERID]) {
		newConfig[YTT_CONFIG_USERID] = YTTGenUUID();
	}

	newConfig[YTT_CONFIG_DEBUG_KEY] = conf[YTT_CONFIG_DEBUG_KEY] || false;
	newConfig[YTT_CONFIG_FAILED_SHARE] = conf[YTT_CONFIG_FAILED_SHARE] || [];
	newConfig[YTT_CONFIG_VERSION] = YTTGetVersion();

	if(!conf[YTT_CONFIG_TOTAL_STATS_KEY] || conf[YTT_CONFIG_TOTAL_TIME_KEY] || conf[YTT_CONFIG_REAL_TIME_KEY]){
		const watchedDur = Object.keys(conf).filter(k => k.startsWith("day")).map(k => new YTTDay(conf[k])).map(c => c.getWatchedDuration()).reduce((acc, cv) => {
			let t = new YTTDuration(acc);
			t.addDuration(cv);
			return t;
		}, new YTTDuration(YTT_DATA_WATCHED));

		const openedDur = Object.keys(conf).filter(k => k.startsWith("day")).map(k => new YTTDay(conf[k])).map(c => c.getOpenedDuration()).reduce((acc, cv) => {
			let t = new YTTDuration(acc);
			t.addDuration(cv);
			return t;
		}, new YTTDuration(YTT_DATA_OPENED));

		const openedCount = Object.keys(conf).filter(k => k.startsWith("day")).map(k => new YTTDay(conf[k])).map(c => c.getCount()).reduce((acc, cv) => (acc || 0) + (cv || 0), 0);

		let totalStats = new YTTDay();
		totalStats.getOpenedDuration().addDuration(openedDur);
		totalStats.getWatchedDuration().addDuration(watchedDur);
		totalStats.addCount(openedCount);

		newConfig[YTT_CONFIG_TOTAL_STATS_KEY] = totalStats;

		YTTRemoveConfig([YTT_CONFIG_TOTAL_TIME_KEY, YTT_CONFIG_REAL_TIME_KEY], null);
	}

	YTTRemoveConfig(["YTTHanddrawn", "YTTTheme"], null);

	YTTSetConfig(newConfig, null);
});

/**
 * Send a request to the distant server.
 * Also retry to send again requests that previously failed.
 * @param request The new event to send.
 */
function sendRequestToAPI(request) {
	/**
	 * Converts timestamp to a string format.
	 * @param timestamp The timestamp to convert.
	 * @returns {string} A string in the format YYYY-MM-DD HH:mm:ss.
	 */
	function timestampToStr(timestamp) {
		if (!timestamp)
			timestamp = new Date().getTime();
		const date = new Date(timestamp);
		return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
	}

	/**
	 * Send data to API server.
	 * @param uuid The UUID of the user.
	 * @param videoId The ID of the youtube video.
	 * @param duration The duration.
	 * @param date The date it happened.
	 * @param type The type of the event to send.
	 * @param onSuccess Callback on success.
	 * @param onFail Callback on error.
	 */
	function sendRequest(uuid, videoId, duration, date, type, onSuccess, onFail) {
		if (duration.getAsMilliseconds() <= 0)
			return true;
		$.ajax({
			url: 'https://yttracker.mrcraftcod.fr/api/v2/' + encodeURI(uuid) + '/stats/add',
			data: {
				videoId: videoId,
				type: type,
				stat: duration.getAsMilliseconds(),
				date: timestampToStr(date),
				browser: YTTGetBrowser()
			},
			method: 'POST',
			async: true,
			error: function () {
				notify(chrome.runtime.getManifest().short_name, 'Failed to send ' + type + ' time to server\nVideoID: ' + videoId + '\nDuration: ' + duration.getAsString(true));
				console.error('Failed to send request to API', uuid, videoId, duration, date, type);
				if (onFail) {
					onFail();
				}
			},
			success: function () {
				notify(chrome.runtime.getManifest().short_name, 'Sent ' + type + ' time to server\nVideoID: ' + videoId + '\nDuration: ' + duration.getAsString(true));
				console.debug('Sent to API', uuid, videoId, duration, date, type);
				if (onSuccess) {
					onSuccess()
				}
			}
		});
	}

	/**
	 * Send a list of requests.
	 * @param uuid The uuid of the user.
	 * @param requests A list of requests to send.
	 */
	function sendAllRequests(uuid, requests) {
		if (requests.length > 0) {
			const trackData = requests.pop();
			if (trackData && trackData['videoID'] && trackData['duration']) {
				sendRequest(uuid, trackData['videoID'], new YTTDuration(trackData['duration']), trackData['date'], trackData['type'], function () {
					sendAllRequests(uuid, requests);
				}, function () {
					YTTConfigAddInArray(YTT_CONFIG_FAILED_SHARE, trackData, null);
					sendAllRequests(uuid, requests);
				});
			}
		}
	}

	request['date'] = new Date().getTime();
	YTTConfigAddInArray(YTT_CONFIG_FAILED_SHARE, request, function () {
		YTTGetConfig([YTT_CONFIG_USERID, YTT_CONFIG_FAILED_SHARE], function (config) {
			const uuid = config[YTT_CONFIG_USERID];
			const toSend = config[YTT_CONFIG_FAILED_SHARE] || [];

			const newConf = {};
			newConf[YTT_CONFIG_FAILED_SHARE] = [];
			YTTSetConfig(newConf, function () {
				sendAllRequests(uuid, toSend);
			});
		});
	});
}

/**
 * Lof only if the debug flag is activated.
 * @param text The text to log.
 */
function logDebug(text) {
	YTTGetConfig(YTT_CONFIG_DEBUG_KEY, function (config) {
		if (config[YTT_CONFIG_DEBUG_KEY]) {
			console.log(text);
		}
	});
}

/**
 * Notify the user with a popup, only if the debug flag is on.
 * @param title The title of the notification.
 * @param text The text.
 * @param force True if forcing to display it (debug flag is overriden).
 */
function notify(title, text, force) {
	YTTGetConfig(YTT_CONFIG_DEBUG_KEY, function (config) {
		if (force || config[YTT_CONFIG_DEBUG_KEY])
			YTTSendNotification({
				type: 'basic',
				iconUrl: '/assets/icon128.png',
				title: title,
				message: text
			});
	});
}

/**
 * Called when the state of the player changed.
 * @param event The event of the change.
 */
function playerStateChange(event) {
	if (event[YTT_STATE_EVENT_STATE_KEY] === YTT_STATE_EVENT_STATE_KEY_PLAYING) {
		logDebug('Started playing at ' + event[YTT_STATE_EVENT_TIME_KEY] + 's');
		YTTSetBadge('P');
		activePlayers[event[YTT_STATE_EVENT_ID_KEY]] = {
			time: new Date(),
			vid: event[YTT_STATE_EVENT_VID_KEY],
			videoTime: event[YTT_STATE_EVENT_TIME_KEY]
		};
	} else if (event[YTT_STATE_EVENT_STATE_KEY] === YTT_STATE_EVENT_STATE_KEY_WATCHED && activePlayers[event[YTT_STATE_EVENT_ID_KEY]] !== null) {
		if (!activePlayers[event[YTT_STATE_EVENT_ID_KEY]])
			return;
		logDebug('Ended playing at ' + event[YTT_STATE_EVENT_TIME_KEY] + 's');
		const TODAY_KEY = YTTGetDayConfigKey();
		const duration = new YTTDuration(YTT_DATA_WATCHED, new Date() - activePlayers[event[YTT_STATE_EVENT_ID_KEY]]['time']);
		const videoID = activePlayers[event[YTT_STATE_EVENT_ID_KEY]]['vid'];
		activePlayers[event[YTT_STATE_EVENT_ID_KEY]] = null;
		let size = 0;
		for (const key in activePlayers)
			if (activePlayers.hasOwnProperty(key) && activePlayers[key] !== null)
				size++;
		if (size < 1) YTTSetBadge('');
		YTTGetConfig([YTT_CONFIG_TOTAL_STATS_KEY, TODAY_KEY, YTT_CONFIG_SHARE_ONLINE], function (config) {
			if (config[YTT_CONFIG_SHARE_ONLINE] === true) {
				sendRequestToAPI({
					videoID: videoID,
					type: 'watched',
					duration: duration
				});
			}
			if (!config[YTT_CONFIG_TOTAL_STATS_KEY])
				config[YTT_CONFIG_TOTAL_STATS_KEY] = new YTTDay();
			else
				config[YTT_CONFIG_TOTAL_STATS_KEY] = new YTTDay(config[YTT_CONFIG_TOTAL_STATS_KEY]);
			if (!config[TODAY_KEY])
				config[TODAY_KEY] = new YTTDay();
			else
				config[TODAY_KEY] = new YTTDay(config[TODAY_KEY]);
			config[YTT_CONFIG_TOTAL_STATS_KEY].getWatchedDuration().addDuration(duration);
			config[TODAY_KEY].getWatchedDuration().addDuration(duration);
			YTTSetConfig(config, null);
			logDebug('Added real time: ' + duration.getAsString(true));
		});
	}
}

/**
 * Called when a video is opened.
 * @param event The event of the opened video.
 */
function setVideoDuration(event) {
	const TODAY_KEY = YTTGetDayConfigKey();
	YTTGetConfig([YTT_CONFIG_IDS_WATCHED_KEY, YTT_CONFIG_START_TIME_KEY, YTT_CONFIG_TOTAL_STATS_KEY, TODAY_KEY, YTT_CONFIG_SHARE_ONLINE], function (config) {
		let key;
		const toRemove = [];
		const IDS = config[YTT_CONFIG_IDS_WATCHED_KEY] || {};
		//noinspection JSDuplicatedDeclaration
		for (key in IDS)
			if (IDS.hasOwnProperty(key) && new Date().getTime() - IDS[key] > 60 * 60 * 1000)
				toRemove.push(key);
		//noinspection JSDuplicatedDeclaration
		for (const toRemoveItem of toRemove)
			delete IDS[toRemoveItem];
		if (!event[YTT_DURATION_EVENT_ID_KEY] || event[YTT_DURATION_EVENT_ID_KEY] === 'undefined') {
			logDebug('Not video page');
			return;
		}
		if (!IDS.hasOwnProperty(event[YTT_DURATION_EVENT_ID_KEY])) {
			IDS[event[YTT_DURATION_EVENT_ID_KEY]] = new Date().getTime();
			const duration = new YTTDuration(YTT_DATA_OPENED, parseInt(event[YTT_DURATION_EVENT_DURATION_KEY]) * 1000);
			if (config[YTT_CONFIG_SHARE_ONLINE] === true) {
				sendRequestToAPI({
					videoID: event[YTT_DURATION_EVENT_ID_KEY],
					type: 'opened',
					duration: duration
				});
			}
			if (!config[YTT_CONFIG_TOTAL_STATS_KEY])
				config[YTT_CONFIG_TOTAL_STATS_KEY] = new YTTDay();
			else
				config[YTT_CONFIG_TOTAL_STATS_KEY] = new YTTDay(config[YTT_CONFIG_TOTAL_STATS_KEY]);
			if (!config[TODAY_KEY])
				config[TODAY_KEY] = new YTTDay();
			else
				config[TODAY_KEY] = new YTTDay(config[TODAY_KEY]);
			config[YTT_CONFIG_TOTAL_STATS_KEY].getOpenedDuration().addDuration(duration);
			config[YTT_CONFIG_TOTAL_STATS_KEY].addCount(1);
			config[YTT_CONFIG_IDS_WATCHED_KEY] = IDS;
			config[YTT_CONFIG_START_TIME_KEY] = config[YTT_CONFIG_START_TIME_KEY] || new Date().getTime();
			config[TODAY_KEY].addCount(1);
			config[TODAY_KEY].getOpenedDuration().addDuration(duration);
			YTTSetConfig(config, null);
			logDebug('New total opened time: ' + config[YTT_CONFIG_TOTAL_STATS_KEY].getOpenedDuration().getAsString(true));
		} else {
			logDebug('Video is not new');
		}
	});
}
