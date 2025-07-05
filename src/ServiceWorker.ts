import "webextension-polyfill-global";
import {ServiceMessageListener} from './ServiceMessageListener'
import {LogManager} from "./LogManager";
import {VideoManager} from "./video/VideoManager";
import {ConfigurationManager} from "./storage/ConfigurationManager";
import {ApiManager} from "./api/ApiManager";
import {NotificationManager} from "./NotificationManager";
import {BadgeManager} from "./BadgeManager";
import {ConfigurationKeys} from "./storage/ConfigurationKeys";
import {DownloadManager} from "./DownloadManager";
import {Runtime} from "webextension-polyfill";

const configurationManager = new ConfigurationManager();
const logManager = new LogManager(configurationManager);
const notificationManager = new NotificationManager(configurationManager);
const apiManager = new ApiManager(logManager, notificationManager, configurationManager);
const badgeManager = new BadgeManager();
const videoManager = new VideoManager(configurationManager, logManager, apiManager, badgeManager);
const downloadManager = new DownloadManager();
const serviceMessageListener = new ServiceMessageListener(logManager, videoManager, downloadManager);

browser.runtime.onMessage.addListener(async (message: any, sender: Runtime.MessageSender) => serviceMessageListener.onMessage(message, sender));

configurationManager.setValue(ConfigurationKeys.VERSION, browser.runtime.getManifest().version);
configurationManager.setValue(ConfigurationKeys.ACTIVE_PLAYERS, null);
