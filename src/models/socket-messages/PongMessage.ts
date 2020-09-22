import { SocketMessageType } from "./enums/SocketMessageType";
import ISocketMessage from "./interfaces/ISocketMessage";

export default class PongMessage implements ISocketMessage {
    type: SocketMessageType = SocketMessageType.PONG;
    constructor() {}

    serialize(): string {
        return JSON.stringify(this);
    }
}