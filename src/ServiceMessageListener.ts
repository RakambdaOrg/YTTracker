import "webextension-polyfill-global";
import {LogMessage} from './messages/LogMessage';
import {LogManager} from "./LogManager";
import {DownloadMessage} from "./messages/DownloadMessage";
import {VideoOpenedMessage} from "./messages/VideoOpenedMessage";
import {VideoManager} from "./video/VideoManager";
import {VideoStoppedMessage} from "./messages/VideoStoppedMessage";
import {VideoStartedMessage} from "./messages/VideoStartedMessage";
import {DownloadManager} from "./DownloadManager";
import {Runtime} from "webextension-polyfill";
import MessageSender = Runtime.MessageSender;

export class ServiceMessageListener {
    private readonly logManager: LogManager;
    private readonly videoManager: VideoManager;
    private readonly downloadManager: DownloadManager;

    public constructor(logManager: LogManager, videoManager: VideoManager, downloadManager: DownloadManager) {
        this.logManager = logManager;
        this.videoManager = videoManager;
        this.downloadManager = downloadManager;
    }

    public async onMessage(message: any, sender: MessageSender): Promise<void> {
        const tabId = sender.tab?.id;

        if (message.type === 'LOG') {
            const msg = message as LogMessage;
            await this.logManager.logDebug(msg.message);
        } else if (message.type === 'DOWNLOAD') {
            await this.downloadManager.downlaod(message as DownloadMessage);
        } else if (message.type === 'NEW_VIDEO_OPENED') {
            await this.videoManager.onVideoOpened(message as VideoOpenedMessage);
        } else if (message.type === 'VIDEO_STARTED') {
            if (!tabId) {
                await this.logManager.logDebug("Received video started event with no tab");
                return;
            }
            await this.videoManager.onVideoStarted(message as VideoStartedMessage, tabId);
        } else if (message.type === 'VIDEO_STOPPED') {
            if (!tabId) {
                await this.logManager.logDebug("Received video started event with no tab");
                return;
            }
            await this.videoManager.onVideoStopped(message as VideoStoppedMessage, tabId);
        }
    }
}