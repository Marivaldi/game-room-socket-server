import { SocketMessageType } from "./enums/SocketMessageType";
import IPlayerSocketMessage from "./interfaces/IPlayerSocketMessage";

export default class PingMessage implements IPlayerSocketMessage {
    type: SocketMessageType = SocketMessageType.PING;
    connectionId: string;
    constructor() {}
    serialize(): string {
        return JSON.stringify(this);
    }
}