import { SocketMessageType } from "./enums/SocketMessageType";
import ISocketMessage from "./interfaces/ISocketMessage";

export default class SystemChatMessage implements ISocketMessage {
    type: SocketMessageType = SocketMessageType.RECEIVE_LOBBY_CHAT;
    public senderId = "SYSTEM";
    public sender = "";
    constructor(public content: string) {}

    serialize(): string {
        return JSON.stringify(this);
    }
}