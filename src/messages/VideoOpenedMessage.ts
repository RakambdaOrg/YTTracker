import {Message} from "./Message";

export interface VideoOpenedMessage extends Message {
    type: 'NEW_VIDEO_OPENED'
    readonly videoId: string;
    readonly durationSeconds: number;
}