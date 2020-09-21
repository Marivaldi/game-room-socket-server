import { SocketMessageType } from "./enums/SocketMessageType";
import IPlayerSocketMessage from "./interfaces/IPlayerSocketMessage";

export default class SendLobbyChatMessage implements IPlayerSocketMessage {
    type: SocketMessageType = SocketMessageType.SEND_LOBBY_CHAT;
    constructor(public lobbyId: string, public content: string) {}
    connectionId: string;
    serialize(): string {
        return JSON.stringify(this);
    }
}