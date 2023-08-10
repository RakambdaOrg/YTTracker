import {YttDuration} from "../storage/YttDuration";
import {LogManager} from "../LogManager";
import {NotificationManager} from "../NotificationManager";
import {ConfigurationManager} from "../storage/ConfigurationManager";
import {ConfigurationKeys} from "../storage/ConfigurationKeys";
import {ApiRequest} from "./ApiRequest";

export class ApiManager {
    private readonly logManager: LogManager;
    private readonly notificationManager: NotificationManager;
    private readonly configurationManager: ConfigurationManager;

    public constructor(logManager: LogManager, notificationManager: NotificationManager, configurationManager: ConfigurationManager) {
        this.logManager = logManager;
        this.notificationManager = notificationManager;
        this.configurationManager = configurationManager;
    }


    public async sendOpenedRequest(datas: { videoID: string, duration: YttDuration }[]): Promise<void> {
        let newData: ApiRequest[] = [];
        for (let data of datas) {
            newData.push({
                type: 'opened',
                ...data
            })
        }
        await this.sendRequests(newData);
    }

    public async sendWatchedRequest(datas: { videoID: string, duration: YttDuration, date: number }[]): Promise<void> {
        let newData: ApiRequest[] = [];
        for (let data of datas) {
            newData.push({
                type: 'watched',
                ...data
            })
        }
        await this.sendRequests(newData);
    }

    private async sendRequests(requests: ApiRequest[]): Promise<void> {
        for (let request of requests) {
            if (!request?.date) {
                request.date = new Date().getTime();
            }
        }

        const failedRequests = await this.configurationManager.getValue(ConfigurationKeys.FAILED_API_REQUESTS) ?? [];
        const allRequests = requests.concat(failedRequests) as [ApiRequest];

        await this.configurationManager.setValue(ConfigurationKeys.FAILED_API_REQUESTS, []);

        let uuid = await this.configurationManager.getValue(ConfigurationKeys.USER_ID);
        if (!uuid) {
            uuid = this.generateUuid();
            await this.configurationManager.setValue(ConfigurationKeys.USER_ID, uuid);
        }
        await this.sendAllRequests(uuid, allRequests);
    }

    private async sendAllRequests(uuid: string, requests: [ApiRequest]): Promise<void> {
        if (requests.length <= 0) {
            return
        }

        const requestData = requests.pop();
        if (requestData && requestData.videoID && requestData.duration) {
            try {
                await this.sendRequest(uuid, requestData);
                await this.notificationManager.notify(`Sent ${requestData.type} time to server`, `VideoID: ${requestData.videoID}\nDuration: ${requestData.duration.getAsString(true)}\nDate: ${requestData.date}`);
                await this.logManager.logDebug('Sent to API', uuid, requestData);
            } catch (e: any) {
                await this.configurationManager.appendArray(ConfigurationKeys.FAILED_API_REQUESTS, [requestData]);
                await this.notificationManager.notify(`Failed to send ${requestData.type} time to server`, `VideoID: ${requestData.videoID}\nDuration: ${requestData.duration.getAsString(true)}\nDate: ${requestData.date}`);
                await this.logManager.logDebug('Failed to send request to API', uuid, requestData);
            }
            await this.sendAllRequests(uuid, requests);
        }
    }

    private async sendRequest(uuid: string, data: ApiRequest): Promise<void> {
        if (data.duration.getAsMilliseconds() <= 0) {
            return;
        }

        const dateTimeStr = this.timestampToStr(data.date);
        const response = await fetch(`https://yttracker.rakambda.fr/api/v2/${encodeURI(uuid)}/stats/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: data.type,
                stat: data.duration.getAsMilliseconds(),
                date: dateTimeStr
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not OK');
        }
    }

    private timestampToStr(timestamp?: number): string {
        if (!timestamp) {
            timestamp = new Date().getTime();
        }
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }

    private generateUuid(): string {
        const lut = [];
        for (let i = 0; i < 256; i++) {
            lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
        }
        const d0 = Math.random() * 0xffffffff | 0;
        const d1 = Math.random() * 0xffffffff | 0;
        const d2 = Math.random() * 0xffffffff | 0;
        const d3 = Math.random() * 0xffffffff | 0;
        return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
            lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
            lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
            lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
    }
}