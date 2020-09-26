import { SocketMessageType } from "./enums/SocketMessageType";
import IPlayerSocketMessage from "./interfaces/IPlayerSocketMessage";;

export default class JoinSpecificLobbyMessage implements IPlayerSocketMessage {
    type: SocketMessageType = SocketMessageType.JOIN_LOBBY;
    constructor(public connectionId: string, public username: string, public lobbyId: string) {}

    serialize(): string {
        return JSON.stringify(this);
    }
}