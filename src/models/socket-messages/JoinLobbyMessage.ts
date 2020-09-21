import { SocketMessageType } from "./enums/SocketMessageType";
import IPlayerSocketMessage from "./interfaces/IPlayerSocketMessage";;

export default class JoinLobbyMessage implements IPlayerSocketMessage {
    type: SocketMessageType = SocketMessageType.JOIN_RANDOM_LOBBY;
    constructor(public connectionId: string, public username: string) {}

    serialize(): string {
        return JSON.stringify(this);
    }
}