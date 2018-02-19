'use strict';

const activePlayers = {};

/**
 * Init config.
 */
YTTGetConfig(null, function (conf) {
	const newConfig = {};
	let shouldClear = false;

	// If the version of the configuration is from before 1.3.0, convert it to the new format.
	if (YTTCompareVersion('1.18.0', conf[YTT_CONFIG_VERSION]) > 0) {
		notify('YTTracker', 'Converting stored data...', true);
		for (const key in conf)
			if (conf.hasOwnProperty(key)) {
				if (key.substring(0, 3) === 'day') {
					const day = conf[key];
					newConfig[key] = new YTTDay(day[YTT_DATA_COUNT], day[YTT_DATA_REAL], day[YTT_DATA_TOTAL]);
				}
				else if (key === YTT_CONFIG_REAL_TIME_KEY || key === YTT_CONFIG_TOTAL_TIME_KEY) {
					newConfig[key] = new YTTDuration(key, conf[key].milliseconds || 0, conf[key].secondes || 0, conf[key].minutes || 0, conf[key].hours || 0, conf[key].days || 0);
				}
				else
					newConfig[key] = conf[key];
			}
		shouldClear = true;
		notify('YTTracker', 'Converting done', true);
	}
	newConfig[YTT_CONFIG_FAILED_SHARE] = conf[YTT_CONFIG_FAILED_SHARE] || [];
	newConfig[YTT_CONFIG_VERSION] = YTTGetVersion();
	if (shouldClear)
		YTTClearConfig(function () {
			YTTSetConfig(newConfig);
		});
	else
		YTTSetConfig(newConfig);
});

/**
 * Send a request to the distant server.
 * Also ry to send again request that previously failed.
 * @param request
 */
function sendRequest(request) {
	function send(uuid, vid, dur, date) {
		function getDate(timestamp) {
			if (!timestamp)
				timestamp = new Date().getTime();
			const d = new Date(timestamp);
			return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
		}

		if (dur.getAsMilliseconds() <= 0)
			return true;
		let rVal = false;
		$.ajax({
			url: 'https://yttracker.mrcraftcod.fr/api/stats/add?uuid=' + encodeURI(uuid) + '&videoID=' + encodeURI(vid) + '&type=' + request['type'] + '&stats=' + dur.getAsMilliseconds() + '&date=' + encodeURI(getDate(date)) + '&browser=' + encodeURI(YTTGetBrowser()),
			method: 'POST',
			async: true,
			error: function () {
				notify(chrome.runtime.getManifest().short_name, 'Failed to send ' + (request['type'] === 1 ? 'watched' : 'opened') + ' time to server\nVideoID: ' + vid + '\nDuration: ' + dur.getAsString(true));
				console.error('YTTF' + request['type'] + '-' + vid + ':' + dur.getAsString(true), true);
				console.error(request, true);
			},
			success: function () {
				rVal = true;
				notify(chrome.runtime.getManifest().short_name, 'Sent ' + (request['type'] === 1 ? 'watched' : 'opened') + ' time to server\nVideoID: ' + vid + '\nDuration: ' + dur.getAsString(true));
				console.log('YTTO-' + request['type'] + '-' + vid + ':' + dur.getAsString(true));
			}
		});
		return rVal;
	}

	request['date'] = new Date().getTime();

	YTTGetConfig([YTT_CONFIG_USERID, YTT_CONFIG_FAILED_SHARE], function (config) {
		config[YTT_CONFIG_FAILED_SHARE] = config[YTT_CONFIG_FAILED_SHARE] || [];
		config[YTT_CONFIG_FAILED_SHARE].push(request);
		const newFailed = [];
		//noinspection JSDuplicatedDeclaration
		for (const key in config[YTT_CONFIG_FAILED_SHARE])
			if (config[YTT_CONFIG_FAILED_SHARE].hasOwnProperty(key)) {
				const req = config[YTT_CONFIG_FAILED_SHARE][key];
				if (req && req !== null && req['videoID'] && req['duration'])
					if (!send(config[YTT_CONFIG_USERID], req['videoID'], req['duration'], req['date']))
						newFailed.push(key);
			}
		config[YTT_CONFIG_FAILED_SHARE] = newFailed;
		YTTSetConfig(config);
	});
}

function log(text) {
	YTTGetConfig(YTT_CONFIG_DEBUG_KEY, function (config) {
		if (config[YTT_CONFIG_DEBUG_KEY]) {
			console.log(text);
		}
	});
}

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

function playerStateChange(event) {
	if (event[YTT_STATE_EVENT_STATE_KEY] === '1') {
		log('Started playing at ' + event[YTT_STATE_EVENT_TIME_KEY] + 's');
		YTTSetBadge('P');
		activePlayers[event[YTT_STATE_EVENT_ID_KEY]] = {
			time: event[YTT_STATE_EVENT_TIME_KEY],
			vid: event[YTT_STATE_EVENT_VID_KEY]
		};
	}
	else if ((event[YTT_STATE_EVENT_STATE_KEY] === '2' || event[YTT_STATE_EVENT_STATE_KEY] === '0' || event[YTT_STATE_EVENT_STATE_KEY] === '-5') && activePlayers[event[YTT_STATE_EVENT_ID_KEY]] !== null) {
		if (!activePlayers[event[YTT_STATE_EVENT_ID_KEY]])
			return;
		log('Ended playing at ' + event[YTT_STATE_EVENT_TIME_KEY] + 's');
		const TODAY_KEY = YTTGetDayConfigKey();
		const duration = new YTTDuration(YTT_DATA_REAL, parseInt((event[YTT_STATE_EVENT_TIME_KEY] - activePlayers[event[YTT_STATE_EVENT_ID_KEY]]['time']) * 1000));
		const videoID = activePlayers[event[YTT_STATE_EVENT_ID_KEY]]['vid'];
		activePlayers[event[YTT_STATE_EVENT_ID_KEY]] = null;
		let size = 0;
		for (const key in activePlayers)
			if (activePlayers.hasOwnProperty(key) && activePlayers[key] !== null)
				size++;
		if (size < 1) YTTSetBadge('');
		YTTGetConfig([YTT_CONFIG_REAL_TIME_KEY, TODAY_KEY, YTT_CONFIG_SHARE_ONLINE], function (config) {
			if (config[YTT_CONFIG_SHARE_ONLINE] === true) {
				sendRequest({
					videoID: videoID,
					type: 1,
					duration: duration
				});
			}
			if (!config[YTT_CONFIG_REAL_TIME_KEY])
				config[YTT_CONFIG_REAL_TIME_KEY] = new YTTDuration(YTT_CONFIG_REAL_TIME_KEY);
			if (!config[TODAY_KEY])
				config[TODAY_KEY] = new YTTDay();
			config[YTT_CONFIG_REAL_TIME_KEY].addDuration(duration);
			config[TODAY_KEY].getRealDuration().addDuration(duration);
			YTTSetConfig(config);
			log('Added real time: ' + duration.getAsString(true));
		});
	}
}

function setVideoDuration(event) {
	const TODAY_KEY = YTTGetDayConfigKey();
	YTTGetConfig([YTT_CONFIG_IDS_WATCHED_KEY, YTT_CONFIG_START_TIME_KEY, YTT_CONFIG_TOTAL_TIME_KEY, TODAY_KEY, YTT_CONFIG_SHARE_ONLINE], function (config) {
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
		if (event[YTT_DURATION_EVENT_ID_KEY] === 'undefined') {
			log('Not video page');
			return;
		}
		if (!IDS.hasOwnProperty(event[YTT_DURATION_EVENT_ID_KEY])) {
			IDS[event[YTT_DURATION_EVENT_ID_KEY]] = new Date().getTime();
			const duration = new YTTDuration(YTT_DATA_TOTAL, parseInt(event[YTT_DURATION_EVENT_DURATION_KEY] * 1000));
			if (config[YTT_CONFIG_SHARE_ONLINE] === true) {
				sendRequest({
					videoID: event[YTT_DURATION_EVENT_ID_KEY],
					type: 2,
					duration: duration
				});
			}
			if (!config[YTT_CONFIG_TOTAL_TIME_KEY])
				config[YTT_CONFIG_TOTAL_TIME_KEY] = new YTTDuration(YTT_CONFIG_TOTAL_TIME_KEY);
			if (!config[TODAY_KEY])
				config[TODAY_KEY] = new YTTDay();
			config[YTT_CONFIG_TOTAL_TIME_KEY].addDuration(duration);
			config[YTT_CONFIG_IDS_WATCHED_KEY] = IDS;
			config[YTT_CONFIG_START_TIME_KEY] = config[YTT_CONFIG_START_TIME_KEY] || new Date().getTime();
			config[TODAY_KEY].addCount(1);
			config[TODAY_KEY].getTotalDuration().addDuration(duration);
			YTTSetConfig(config);
			log('New total time: ' + config[YTT_CONFIG_TOTAL_TIME_KEY].getAsString(true));
		}
		else {
			log('Video is not new');
		}
	});
}

YTTGetConfig([YTT_CONFIG_USERID, YTT_CONFIG_DEBUG_KEY], function (config) {
	let userID = config[YTT_CONFIG_USERID];

	if (!userID) {
		userID = YTTGenUUID();
		const newConfig = {};
		newConfig[YTT_CONFIG_USERID] = userID;
		YTTSetConfig(newConfig);
	}
	let conf = {};
	conf[YTT_CONFIG_DEBUG_KEY] = config[YTT_CONFIG_DEBUG_KEY] || false;
	YTTSetConfig(conf);
});
