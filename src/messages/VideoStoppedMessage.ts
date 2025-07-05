import {Message} from "./Message";

export interface VideoStoppedMessage extends Message {
    type: 'VIDEO_STOPPED'
    readonly videoId: string;
    readonly durationSeconds: number;
    readonly playerId: string;
}