import {VideoOpenedMessage} from "../messages/VideoOpenedMessage";
import {ConfigurationManager} from "../storage/ConfigurationManager";
import {ConfigurationKeys} from "../storage/ConfigurationKeys";
import {YttDuration} from "../storage/YttDuration";
import {LogManager} from "../LogManager";
import {YttDay} from "../storage/YttDay";
import {ApiManager} from "../api/ApiManager";
import {VideoStartedMessage} from "../messages/VideoStartedMessage";
import {BadgeManager} from "../BadgeManager";
import {VideoStoppedMessage} from "../messages/VideoStoppedMessage";
import {DurationInfo} from "./DurationInfo";

export class VideoManager {
    private readonly ONE_HOUR_MILLISECONDS = 60 * 60 * 1000;
    private readonly MINIMUM_WATCH_THRESHOLD = 500; //0.5s
    private readonly MILLISECONDS_PER_DAY = 86400 * 1000;

    private readonly configurationManager: ConfigurationManager;
    private readonly logManager: LogManager;
    private readonly apiManager: ApiManager;
    private readonly badgeManager: BadgeManager;

    constructor(configurationManager: ConfigurationManager, logManager: LogManager, apiManager: ApiManager, badgeManager: BadgeManager) {
        this.configurationManager = configurationManager;
        this.logManager = logManager;
        this.apiManager = apiManager;
        this.badgeManager = badgeManager;
    }

    public async onVideoOpened(message: VideoOpenedMessage): Promise<void> {
        const todayConfigKey = this.configurationManager.getTodayKey();
        const config = await this.configurationManager.getValues([
            ConfigurationKeys.IDS_WATCHED,
            ConfigurationKeys.START_TIME,
            ConfigurationKeys.TOTAL_STATS,
            ConfigurationKeys.SHARE_ONLINE,
            todayConfigKey
        ]);

        const watchedKeys = (config[ConfigurationKeys.IDS_WATCHED] || {}) as Record<string, number>;
        this.removeOpenedLongAgo(watchedKeys);

        if (!message.videoId) {
            await this.logManager.logDebug('Not video page');
            return;
        }

        if (message.videoId in watchedKeys) {
            await this.logManager.logDebug('Video is not new');
            return
        }

        watchedKeys[message.videoId] = new Date().getTime();
        const duration = YttDuration.getOpened({seconds: message.durationSeconds});

        let totalStats = new YttDay();
        if (config[ConfigurationKeys.TOTAL_STATS]) {
            totalStats.load(config[ConfigurationKeys.TOTAL_STATS]);
        }

        let todayStats = new YttDay();
        if (config[todayConfigKey]) {
            todayStats.load(config[todayConfigKey]);
        }

        totalStats.total.addDuration(duration);
        totalStats.addCount(1);
        todayStats.total.addDuration(duration);
        todayStats.addCount(1);

        config[todayConfigKey] = todayStats
        config[ConfigurationKeys.TOTAL_STATS] = totalStats
        config[ConfigurationKeys.IDS_WATCHED] = watchedKeys;
        config[ConfigurationKeys.START_TIME] = config[ConfigurationKeys.START_TIME] || new Date().getTime();

        await this.configurationManager.setValues(config);
        await this.logManager.logDebug('New total opened time: ' + totalStats.total.getAsString(true));

        if (config[ConfigurationKeys.SHARE_ONLINE] === true) {
            await this.apiManager.sendOpenedRequest([{videoID: message.videoId, duration: duration}]);
        }
    }

    public async onVideoStarted(message: VideoStartedMessage) {
        await this.logManager.logDebug(`Started playing at ${message.durationSeconds}s`);
        await this.badgeManager.set('P');

        let activePlayers = await this.configurationManager.getValue(ConfigurationKeys.ACTIVE_PLAYERS) || {};
        activePlayers[message.playerId] = {
            time: new Date().getTime(),
            vid: message.videoId,
            videoTime: message.durationSeconds
        };
        await this.configurationManager.setValue(ConfigurationKeys.ACTIVE_PLAYERS, activePlayers)
    }

    public async onVideoStopped(message: VideoStoppedMessage) {
        let activePlayers = await this.configurationManager.getValue(ConfigurationKeys.ACTIVE_PLAYERS) || {};

        const activePlayer = activePlayers[message.playerId];
        if (!activePlayer) {
            return;
        }
        await this.logManager.logDebug(`Ended playing at ${message.durationSeconds}s`);

        delete activePlayer[message.playerId];
        await this.configurationManager.setValue(ConfigurationKeys.ACTIVE_PLAYERS, activePlayers);

        if (activePlayers.length < 1) {
            await this.badgeManager.reset();
        }

        const todayKey = this.configurationManager.getTodayKey();
        const currentTime = new Date().getTime();

        let watchedMilliseconds = currentTime - activePlayer['time'];
        if (watchedMilliseconds < this.MINIMUM_WATCH_THRESHOLD) {
            return

        }

        let startDayDate = new Date();
        startDayDate.setHours(0, 0, 0, 0);
        let msSinceThisMorning = currentTime - startDayDate.getTime();
        let durationsInfo = {} as Record<string, DurationInfo>;
        let configDayKeys = [todayKey];

        if (watchedMilliseconds > msSinceThisMorning) {
            durationsInfo[todayKey] = {
                date: currentTime,
                duration: YttDuration.getWatched({milliseconds: msSinceThisMorning})
            };
            watchedMilliseconds -= msSinceThisMorning;
            let currentDay = startDayDate;
            currentDay.setHours(23, 59, 59, 0);
            while (watchedMilliseconds > 0) {
                currentDay.setTime(currentDay.getTime() - this.MILLISECONDS_PER_DAY);
                let dayKey = this.configurationManager.getDayKey(currentDay);
                let watchedThisDay = Math.min(this.MILLISECONDS_PER_DAY, watchedMilliseconds);
                durationsInfo[dayKey] = {
                    date: currentDay.getTime(),
                    duration: YttDuration.getWatched({milliseconds: watchedThisDay})
                };
                configDayKeys.push(dayKey);
                watchedMilliseconds -= watchedThisDay;
            }
        } else {
            durationsInfo[todayKey] = {
                date: currentTime,
                duration: YttDuration.getWatched({milliseconds: msSinceThisMorning})
            };
        }

        let config = await this.configurationManager.getValues([ConfigurationKeys.TOTAL_STATS, ConfigurationKeys.SHARE_ONLINE, ...configDayKeys]);

        let totalStats = new YttDay();
        if (config[ConfigurationKeys.TOTAL_STATS]) {
            totalStats.load(config[ConfigurationKeys.TOTAL_STATS]);
        }
        config[ConfigurationKeys.TOTAL_STATS] = totalStats;

        for (const dayKey in durationsInfo) {
            const durationInfo = durationsInfo[dayKey];
            if (!durationInfo){
                continue;
            }

            let dayStats = new YttDay();
            if (config[dayKey]) {
                dayStats.load(config[dayKey]);
            }
            config[dayKey] = dayStats;

            totalStats.real.addDuration(durationInfo.duration);
            dayStats.real.addDuration(durationInfo.duration);

            await this.logManager.logDebug(`Added real time: ${durationInfo.duration.getAsString(true)} for day ${new Date(durationInfo.date)}`);
        }

        await this.configurationManager.setValues(config);

        if (config[ConfigurationKeys.SHARE_ONLINE] === true) {
            let requests = [];
            for (const dayKey in durationsInfo) {
                const durationInfo = durationsInfo[dayKey];
                if (!durationInfo){
                    continue;
                }
                
                requests.push({videoID: message.videoId, duration: durationInfo.duration, date: durationInfo.date});
            }
            await this.apiManager.sendWatchedRequest(requests);
        }
    }

    private removeOpenedLongAgo(config: Record<string, number>): void {
        const keysToRemove = [];

        const now = new Date().getTime();
        for (const key in config) {
            if (now - (config[key] ?? now) > this.ONE_HOUR_MILLISECONDS) {
                keysToRemove.push(key);
            }
        }

        for (const key of keysToRemove) {
            delete config[key];
        }
    }
}