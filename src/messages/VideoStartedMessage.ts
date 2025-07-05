import {Message} from "./Message";

export interface VideoStartedMessage extends Message {
    type: 'VIDEO_STARTED'
    readonly videoId: string;
    readonly durationSeconds: number;
    readonly playerId: string;
}