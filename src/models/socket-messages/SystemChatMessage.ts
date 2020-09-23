import { SocketMessageType } from "./enums/SocketMessageType";
import { SystemMessageLevel } from "./enums/SystemMessageLevel";
import ISocketMessage from "./interfaces/ISocketMessage";

export default class SystemChatMessage implements ISocketMessage {
    type: SocketMessageType = SocketMessageType.RECEIVE_LOBBY_CHAT;
    public senderId = "SYSTEM";
    public sender = "";
    constructor(public content: string, public level : SystemMessageLevel) {}

    serialize(): string {
        return JSON.stringify(this);
    }
}