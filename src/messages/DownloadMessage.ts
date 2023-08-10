import {Message} from "./Message";

export interface DownloadMessage extends Message {
    type: 'DOWNLOAD'
    readonly data: any;
    readonly name: string;
    readonly key: string;
}