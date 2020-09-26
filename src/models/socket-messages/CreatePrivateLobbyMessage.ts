import { SocketMessageType } from "./enums/SocketMessageType";
import IPlayerSocketMessage from "./interfaces/IPlayerSocketMessage";;

export default class CreatePrivateLobbyMessage implements IPlayerSocketMessage {
    type: SocketMessageType = SocketMessageType.CREATE_PRIVATE_LOBBY;
    constructor(public connectionId: string, public username: string) {}

    serialize(): string {
        return JSON.stringify(this);
    }
}