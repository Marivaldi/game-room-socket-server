import { SocketMessageType } from "./enums/SocketMessageType";
import ISocketMessage from "./interfaces/ISocketMessage";

export default class ConnectedMessage implements ISocketMessage {
    type: SocketMessageType = SocketMessageType.CONNECTED;
    constructor(public connectionId: string) {}

    serialize(): string {
        return JSON.stringify(this);
    }
}