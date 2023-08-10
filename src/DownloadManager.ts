import * as browser from 'webextension-polyfill';
import {DownloadMessage} from "./messages/DownloadMessage";

export class DownloadManager{
    public async downlaod(message: DownloadMessage): Promise<void> {
        const json = JSON.stringify(message.data);
        const downloadId = await browser.downloads.download({
            url: json,
            filename: message.name,
            saveAs: true
        });

        return new Promise(resolve => (typeof browser === 'undefined' ? chrome : browser).downloads.onChanged.addListener(download => {
            if (download.id === downloadId && (download.state && (download.state.current === 'interrupted' || download.state.current === 'complete'))) {
                resolve();
            }
        }));
    }
}