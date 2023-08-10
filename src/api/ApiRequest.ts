import {YttDuration} from "../storage/YttDuration";

export interface ApiRequest {
    readonly duration: YttDuration;
    readonly videoID: string;
    readonly type: string;
    date?: number;
}