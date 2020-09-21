import { SocketMessageType } from "./enums/SocketMessageType";
import ISocketMessage from "./interfaces/ISocketMessage";

export default class ReceiveLobbyChatMessage implements ISocketMessage {
    type: SocketMessageType = SocketMessageType.RECEIVE_LOBBY_CHAT;
    constructor(public senderId: string, public sender: string, public content: string) {}

    serialize(): string {
        return JSON.stringify(this);
    }
}