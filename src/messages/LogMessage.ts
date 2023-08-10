import {Message} from "./Message";

export interface LogMessage extends Message {
    type: 'LOG'
    readonly message: any;
}