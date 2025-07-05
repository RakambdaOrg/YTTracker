import "webextension-polyfill-global";
import $ from "jquery";
import {ContentScriptConstants} from "./hook/ContentScriptConstants";
import {VideoStoppedMessage} from "./messages/VideoStoppedMessage";
import {VideoOpenedMessage} from "./messages/VideoOpenedMessage";
import {LogMessage} from "./messages/LogMessage";
import {VideoStartedMessage} from "./messages/VideoStartedMessage";
import {StringUtils} from "./api/StringUtils";

export class ContentScript {
    private readonly playerId: string;

    constructor() {
        this.playerId = StringUtils.generateUuid();
    }

    private onStateChanged(mutation: MutationRecord): void {
        const textContent = mutation.target.textContent;
        if (!textContent) {
            return;
        }

        const values = textContent.split(ContentScriptConstants.SPLITTER);
        const videoId = $(`#${ContentScriptConstants.PLAYER_INFO}`).text().split(ContentScriptConstants.SPLITTER)[0];
        const duration = parseInt(values[1] ?? "-1");
        const changeType = values[0];
        if (!videoId || duration < 0) {
            return;
        }

        if (changeType === ContentScriptConstants.STATE_KEY_PLAYING) {
            const event: VideoStartedMessage = {
                type: "VIDEO_STARTED",
                durationSeconds: duration,
                videoId: videoId,
                playerId: this.playerId
            };
            browser.runtime.sendMessage(event);
        } else if (changeType === ContentScriptConstants.STATE_KEY_WATCHED) {
            const event: VideoStoppedMessage = {
                type: "VIDEO_STOPPED",
                durationSeconds: duration,
                videoId: videoId,
                playerId: this.playerId
            };
            browser.runtime.sendMessage(event);
        }
    }

    private onInfoChanged(mutation: MutationRecord): void {
        const textContent = mutation.target.textContent;
        if (!textContent) {
            return;
        }

        const values = textContent.split(ContentScriptConstants.SPLITTER);

        const videoId = values[0];
        const durationSeconds = parseInt(values[1] ?? "-1");
        if (!videoId || durationSeconds < 0) {
            return;
        }

        const event: VideoOpenedMessage = {
            type: "NEW_VIDEO_OPENED",
            durationSeconds: durationSeconds,
            videoId: videoId
        };
        browser.runtime.sendMessage(event);
    }

    private onUnload(): void {
        const videoId = $(`#${ContentScriptConstants.PLAYER_INFO}`).text().split(ContentScriptConstants.SPLITTER)[0];
        const duration = $(`#${ContentScriptConstants.PLAYER_TIME_2}`).text();
        if (!videoId) {
            return;
        }

        const event: VideoStoppedMessage = {
            type: "VIDEO_STOPPED",
            durationSeconds: parseInt(duration),
            videoId: videoId,
            playerId: this.playerId
        };
        browser.runtime.sendMessage(event);
    }

    private observeElement(id: string, callback: (value: MutationRecord, index: number, array: MutationRecord[]) => void): void {
        const element = document.getElementById(id);
        if (!element) {
            return;
        }

        const observer = new MutationObserver(mutations => {
            mutations.forEach(callback);
        });

        observer.observe(element, {
            attributes: false, childList: true, characterData: true, subtree: true
        });
    }

    private getInjectDiv(id: string, content: string): string {
        return `<div id="${id}" style="display: none;">${content}</div>`;
    }

    public injectCode(): void {
        const body = $('body');
        body.append(this.getInjectDiv(ContentScriptConstants.PLAYER_STATE, '0'));
        body.append(this.getInjectDiv(ContentScriptConstants.PLAYER_INFO, ''));
        body.append(this.getInjectDiv(ContentScriptConstants.PLAYER_TIME_1, '0'));
        body.append(this.getInjectDiv(ContentScriptConstants.PLAYER_TIME_2, '0'));

        $(window).on('beforeunload', this.onUnload);

        const hookerInj = document.createElement('script');
        const docFrag = document.createDocumentFragment();

        hookerInj.type = 'text/javascript';
        hookerInj.src = browser.runtime.getURL('Hooker.js');

        docFrag.appendChild(hookerInj);
        (document.head || document.documentElement).appendChild(docFrag);

        this.observeElement(ContentScriptConstants.PLAYER_STATE, this.onStateChanged);
        this.observeElement(ContentScriptConstants.PLAYER_INFO, this.onInfoChanged);

        const logMessage: LogMessage = {
            type: "LOG",
            message: "Injected player dom"
        };
        browser.runtime.sendMessage(logMessage);
    }
}

$(() => {
    new ContentScript().injectCode();
});