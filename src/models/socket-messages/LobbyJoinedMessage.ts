import { SocketMessageType } from "./enums/SocketMessageType";
import ISocketMessage from "./interfaces/ISocketMessage";

export default class LobbyJoinedMessage implements ISocketMessage {
    type: SocketMessageType = SocketMessageType.LOBBY_JOINED;
    constructor(public lobbyId: string) {}

    serialize(): string {
        return JSON.stringify(this);
    }
}