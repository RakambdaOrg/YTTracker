/**
 * Send a request to the distant server.
 * Also retry to send again requests that previously failed.
 * @param {Array.<Object>} requests The new event to send.
 */
function sendRequestsToAPI(requests) {
    /**
     * Converts timestamp to a string format.
     * @param {number} timestamp The timestamp to convert.
     * @returns {string} A string in the format YYYY-MM-DD HH:mm:ss.
     */
    function timestampToStr(timestamp) {
        if (!timestamp) {
            timestamp = new Date().getTime();
        }
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }

    /**
     * Send data to API server.
     * @param {string} uuid The UUID of the user.
     * @param {string} videoId The ID of the youtube video.
     * @param {YTTDuration} duration The duration.
     * @param {number} date The date it happened.
     * @param {string} type The type of the event to send.
     * @param {?function} onSuccess Callback on success.
     * @param {?function} onFail Callback on error.
     */
    function sendRequest(uuid, videoId, duration, date, type, onSuccess, onFail) {
        if (duration.getAsMilliseconds() <= 0) {
            return true;
        }
        const timeStr = timestampToStr(date);
        fetch(`https://yttracker.rakambda.fr/api/v2/${encodeURI(uuid)}/stats/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: type,
                stat: duration.getAsMilliseconds(),
                date: timeStr
            })
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not OK');
            }
            notify(`Sent ${type} time to server`, `VideoID: ${videoId}\nDuration: ${duration.getAsString(true)}\nDate: ${timeStr}`);
            console.debug('Sent to API', uuid, videoId, duration, date, type);
            if (onSuccess) {
                onSuccess();
            }
        }).catch(error => {
            notify(`Failed to send ${type} time to server`, `VideoID: ${videoId}\nDuration: ${duration.getAsString(true)}\nDate: ${timeStr}`);
            console.error('Failed to send request to API', uuid, videoId, duration, date, type);
            if (onFail) {
                onFail();
            }
        });
    }

    /**
     * Send a list of requests.
     * @param {string} uuid The uuid of the user.
     * @param {[Object]} requests A list of requests to send.
     */
    function sendAllRequests(uuid, requests) {
        if (requests.length > 0) {
            const trackData = requests.pop();
            if (trackData && trackData['videoID'] && trackData['duration']) {
                sendRequest(uuid, trackData['videoID'], new YTTDuration(trackData['duration']), trackData['date'], trackData['type'], function () {
                    sendAllRequests(uuid, requests);
                }, () => {
                    YTTConfigAddInArray(YTT_CONFIG_FAILED_SHARE, [trackData]);
                    sendAllRequests(uuid, requests);
                });
            }
        }
    }

    requests.forEach(r => {
        if (!r.hasOwnProperty('date')) {
            r['date'] = new Date().getTime();
        }
    });

    YTTConfigAddInArray(YTT_CONFIG_FAILED_SHARE, requests).then(() => {
        YTTGetConfig([YTT_CONFIG_USERID, YTT_CONFIG_FAILED_SHARE]).then(config => {
            const uuid = config[YTT_CONFIG_USERID];
            const toSend = config[YTT_CONFIG_FAILED_SHARE] || [];

            const newConf = {};
            newConf[YTT_CONFIG_FAILED_SHARE] = [];
            YTTSetConfig(newConf).then(() => sendAllRequests(uuid, toSend));
        });
    });
}

/**
 * Lof only if the debug flag is activated.
 * @param {string} text The text to log.
 */
function logDebug(text) {
    YTTGetConfig(YTT_CONFIG_DEBUG_KEY).then(config => {
        if (config[YTT_CONFIG_DEBUG_KEY]) {
            console.log(text);
        }
    });
}

/**
 * Notify the user with a popup, only if the debug flag is on.
 * @param {string} title The title of the notification.
 * @param {string} text The text.
 * @param {boolean=false} force True if forcing to display it (debug flag is overriden).
 */
function notify(title, text, force = false) {
    YTTGetConfig(YTT_CONFIG_DEBUG_KEY).then(config => {
        if (force || config[YTT_CONFIG_DEBUG_KEY]) {
            YTTSendNotification({
                type: 'basic',
                iconUrl: '/assets/icon128.png',
                title: title,
                message: text
            });
        }
    });
}

/**
 * @param {object} event The event of the change.
 */
function onVideoPlay(event) {
    logDebug(`Started playing at ${event[YTT_STATE_EVENT_TIME_KEY]}s`);
    YTTSetBadge('P');
    YTTGetConfig([YTT_CONFIG_ACTIVE_PLAYERS]).then(config => {
        config[YTT_CONFIG_ACTIVE_PLAYERS] = config[YTT_CONFIG_ACTIVE_PLAYERS] || {};

        config[YTT_CONFIG_ACTIVE_PLAYERS][event[YTT_STATE_EVENT_ID_KEY]] = {
            time: new Date().getTime(),
            vid: event[YTT_STATE_EVENT_VID_KEY],
            videoTime: event[YTT_STATE_EVENT_TIME_KEY]
        };
        YTTSetConfig(config);
    });
}

/**
 * @param {object} event The event of the change.
 */
function onVideoStop(event) {
    YTTGetConfig([YTT_CONFIG_ACTIVE_PLAYERS]).then(config => {
        let activePlayer = config[YTT_CONFIG_ACTIVE_PLAYERS][event[YTT_STATE_EVENT_ID_KEY]];
        if (!activePlayer) {
            return;
        }
        config[YTT_CONFIG_ACTIVE_PLAYERS][event[YTT_STATE_EVENT_ID_KEY]] = null;
        logDebug(`Ended playing at ${event[YTT_STATE_EVENT_TIME_KEY]}s`);

        const videoID = activePlayer['vid'];
        let size = 0;
        for (const key in config[YTT_CONFIG_ACTIVE_PLAYERS]) {
            if (config[YTT_CONFIG_ACTIVE_PLAYERS].hasOwnProperty(key) && config[YTT_CONFIG_ACTIVE_PLAYERS][key] !== null) {
                size++;
            }
        }
        if (size < 1) {
            YTTSetBadge('');
        }

        YTTSetConfig(config).then(() => {
            let currentTime = new Date().getTime();
            let watchedMilliseconds = currentTime - activePlayer['time'];

            if (watchedMilliseconds > YTT_MINIMUM_WATCH_THRESHOLD) {
                let startDayDate = new Date();
                startDayDate.setHours(0, 0, 0, 0);

                let msSinceThisMorning = currentTime - startDayDate.getTime();
                let durationsInfo = {};

                if (watchedMilliseconds > msSinceThisMorning) {
                    durationsInfo[YTTGetDayConfigKey()] = {
                        date: currentTime,
                        duration: new YTTDuration(YTT_DATA_WATCHED, msSinceThisMorning)
                    };
                    watchedMilliseconds -= msSinceThisMorning;
                    let currentDay = startDayDate;
                    currentDay.setHours(23, 59, 59, 0);
                    while (watchedMilliseconds > 0) {
                        currentDay.setTime(currentDay.getTime() - YTT_MS_PER_DAY);
                        let dayKey = YTTGetDayConfigKey(currentDay);
                        let watchedThisDay = Math.min(YTT_MS_PER_DAY, watchedMilliseconds);
                        durationsInfo[dayKey] = {
                            date: currentDay.getTime(),
                            duration: new YTTDuration(YTT_DATA_WATCHED, watchedThisDay)
                        };
                        watchedMilliseconds -= watchedThisDay;
                    }
                } else {
                    durationsInfo[YTTGetDayConfigKey()] = {
                        date: currentTime,
                        duration: new YTTDuration(YTT_DATA_WATCHED, watchedMilliseconds)
                    };
                }

                YTTGetConfig([YTT_CONFIG_TOTAL_STATS_KEY, YTT_CONFIG_SHARE_ONLINE].concat(Object.keys(durationsInfo).filter(k => durationsInfo.hasOwnProperty(k)))).then(config => {
                    if (!config[YTT_CONFIG_TOTAL_STATS_KEY]) {
                        config[YTT_CONFIG_TOTAL_STATS_KEY] = new YTTDay();
                    } else {
                        config[YTT_CONFIG_TOTAL_STATS_KEY] = new YTTDay(config[YTT_CONFIG_TOTAL_STATS_KEY]);
                    }

                    Object.keys(durationsInfo).filter(k => durationsInfo.hasOwnProperty(k)).forEach(dayKey => {
                        const durationInfo = durationsInfo[dayKey];
                        const duration = durationInfo['duration'];
                        const timestamp = durationInfo['date'];

                        if (!config[dayKey]) {
                            config[dayKey] = new YTTDay();
                        } else {
                            config[dayKey] = new YTTDay(config[dayKey]);
                        }

                        config[YTT_CONFIG_TOTAL_STATS_KEY].getWatchedDuration().addDuration(duration);
                        config[dayKey].getWatchedDuration().addDuration(duration);

                        logDebug(`Added real time: ${duration.getAsString(true)} for day ${new Date(timestamp)}`);
                    });

                    YTTSetConfig(config).then(() => {
                        if (config[YTT_CONFIG_SHARE_ONLINE] === true) {
                            sendRequestsToAPI(Object.keys(durationsInfo).filter(k => durationsInfo.hasOwnProperty(k)).map(dayKey => {
                                const durationInfo = durationsInfo[dayKey];
                                const duration = durationInfo['duration'];
                                const timestamp = durationInfo['date'];

                                return {
                                    date: timestamp,
                                    videoID: videoID,
                                    type: 'watched',
                                    duration: duration
                                };
                            }));
                        }
                    });
                });
            }
        });
    });
}

/**
 * Called when the state of the player changed.
 * @param {object} event The event of the change.
 */
function onVideoEvent(event) {
    if (event[YTT_STATE_EVENT_STATE_KEY] === YTT_STATE_EVENT_STATE_KEY_PLAYING) {
        onVideoPlay(event);
    } else if (event[YTT_STATE_EVENT_STATE_KEY] === YTT_STATE_EVENT_STATE_KEY_WATCHED) {
        onVideoStop(event);
    }
}

/**
 * Called when a video is opened.
 * @param {Object} event The event of the opened video.
 */
function onVideoOpened(event) {
    const TODAY_KEY = YTTGetDayConfigKey();
    YTTGetConfig([YTT_CONFIG_IDS_WATCHED_KEY, YTT_CONFIG_START_TIME_KEY, YTT_CONFIG_TOTAL_STATS_KEY, TODAY_KEY, YTT_CONFIG_SHARE_ONLINE]).then(config => {
        let key;
        const toRemove = [];
        const IDS = config[YTT_CONFIG_IDS_WATCHED_KEY] || {};
        //noinspection JSDuplicatedDeclaration
        for (key in IDS) {
            if (IDS.hasOwnProperty(key) && new Date().getTime() - IDS[key] > 60 * 60 * 1000) {
                toRemove.push(key);
            }
        }
        //noinspection JSDuplicatedDeclaration
        for (const toRemoveItem of toRemove) {
            delete IDS[toRemoveItem];
        }
        if (!event[YTT_DURATION_EVENT_ID_KEY] || event[YTT_DURATION_EVENT_ID_KEY] === 'undefined') {
            logDebug('Not video page');
            return;
        }
        if (!IDS.hasOwnProperty(event[YTT_DURATION_EVENT_ID_KEY])) {
            IDS[event[YTT_DURATION_EVENT_ID_KEY]] = new Date().getTime();
            const duration = new YTTDuration(YTT_DATA_OPENED, parseInt(event[YTT_DURATION_EVENT_DURATION_KEY]) * 1000);
            if (config[YTT_CONFIG_SHARE_ONLINE] === true) {
                sendRequestsToAPI([{
                    videoID: event[YTT_DURATION_EVENT_ID_KEY],
                    type: 'opened',
                    duration: duration
                }]);
            }
            if (!config[YTT_CONFIG_TOTAL_STATS_KEY]) {
                config[YTT_CONFIG_TOTAL_STATS_KEY] = new YTTDay();
            } else {
                config[YTT_CONFIG_TOTAL_STATS_KEY] = new YTTDay(config[YTT_CONFIG_TOTAL_STATS_KEY]);
            }
            if (!config[TODAY_KEY]) {
                config[TODAY_KEY] = new YTTDay();
            } else {
                config[TODAY_KEY] = new YTTDay(config[TODAY_KEY]);
            }
            config[YTT_CONFIG_TOTAL_STATS_KEY].getOpenedDuration().addDuration(duration);
            config[YTT_CONFIG_TOTAL_STATS_KEY].addCount(1);
            config[YTT_CONFIG_IDS_WATCHED_KEY] = IDS;
            config[YTT_CONFIG_START_TIME_KEY] = config[YTT_CONFIG_START_TIME_KEY] || new Date().getTime();
            config[TODAY_KEY].addCount(1);
            config[TODAY_KEY].getOpenedDuration().addDuration(duration);
            YTTSetConfig(config);
            logDebug('New total opened time: ' + config[YTT_CONFIG_TOTAL_STATS_KEY].getOpenedDuration().getAsString(true));
        } else {
            logDebug('Video is not new');
        }
    });
}

/**
 * @param {any} request
 * @param {MessageSender} sender
 * @return {boolean | undefined}
 */
function messageListener(request, sender) {
    let requestType = request[YTT_MESSAGE_TYPE_KEY];

    if (requestType === YTT_LOG_EVENT) {
        logDebug(request[YTT_MESSAGE_VALUE_KEY] || 'undefined');
    } else if (requestType === YTT_DOWNLOAD_EVENT) {
        const payload = request[YTT_MESSAGE_VALUE_KEY];
        YTTDownloadObject(payload[YTT_DOWNLOAD_EVENT_DATA_KEY], payload[YTT_DOWNLOAD_EVENT_NAME_KEY]).then(payload[YTT_DOWNLOAD_EVENT_CALLBACK_KEY]);
    } else if (requestType === YTT_STATE_EVENT) {
        request[YTT_MESSAGE_VALUE_KEY][YTT_STATE_EVENT_ID_KEY] = sender.tab.id;
        onVideoEvent(request[YTT_MESSAGE_VALUE_KEY]);
    } else if (requestType === YTT_DURATION_EVENT) {
        request[YTT_MESSAGE_VALUE_KEY][YTT_DURATION_EVENT_TABID_KEY] = sender.tab.id;
        onVideoOpened(request[YTT_MESSAGE_VALUE_KEY]);
    }
}

if (typeof browser === 'undefined') {
    chrome.runtime.onMessage.addListener(messageListener);
} else {
    browser.runtime.onMessage.addListener(messageListener);
    browser.runtime.onMessageExternal.addListener(messageListener);
}

function setupExtension() {
    YTTGetConfig().then(conf => {
        const newConfig = {};

        if (!conf[YTT_CONFIG_USERID]) {
            newConfig[YTT_CONFIG_USERID] = YTTGenUUID();
        }

        newConfig[YTT_CONFIG_ACTIVE_PLAYERS] = {};

        newConfig[YTT_CONFIG_DEBUG_KEY] = conf[YTT_CONFIG_DEBUG_KEY] || false;
        newConfig[YTT_CONFIG_FAILED_SHARE] = conf[YTT_CONFIG_FAILED_SHARE] || [];
        newConfig[YTT_CONFIG_VERSION] = YTTGetVersion();
        newConfig[YTT_CONFIG_WEIRD_DATA_THRESHOLD] = conf[YTT_CONFIG_WEIRD_DATA_THRESHOLD] || 48 * 60 * 60 * 1000;

        if (!conf[YTT_CONFIG_TOTAL_STATS_KEY] || conf[YTT_CONFIG_TOTAL_TIME_KEY] || conf[YTT_CONFIG_REAL_TIME_KEY]) {
            const watchedDur = Object.keys(conf).filter(k => k.startsWith('day')).map(k => new YTTDay(conf[k])).map(c => c.getWatchedDuration()).reduce((acc, cv) => {
                let t = new YTTDuration(acc);
                t.addDuration(cv);
                return t;
            }, new YTTDuration(YTT_DATA_WATCHED));

            const openedDur = Object.keys(conf).filter(k => k.startsWith('day')).map(k => new YTTDay(conf[k])).map(c => c.getOpenedDuration()).reduce((acc, cv) => {
                let t = new YTTDuration(acc);
                t.addDuration(cv);
                return t;
            }, new YTTDuration(YTT_DATA_OPENED));

            const openedCount = Object.keys(conf).filter(k => k.startsWith('day')).map(k => new YTTDay(conf[k])).map(c => c.getCount()).reduce((acc, cv) => (acc || 0) + (cv || 0), 0);

            let totalStats = new YTTDay();
            totalStats.getOpenedDuration().addDuration(openedDur);
            totalStats.getWatchedDuration().addDuration(watchedDur);
            totalStats.addCount(openedCount);

            newConfig[YTT_CONFIG_TOTAL_STATS_KEY] = totalStats;

            YTTRemoveConfig([YTT_CONFIG_TOTAL_TIME_KEY, YTT_CONFIG_REAL_TIME_KEY]);
        }

        YTTRemoveConfig(['YTTHanddrawn', 'YTTTheme']);

        YTTSetConfig(newConfig);
    });
}

setupExtension();
