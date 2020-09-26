import { SocketMessageType } from "./enums/SocketMessageType";
import IPlayerSocketMessage from "./interfaces/IPlayerSocketMessage";;

export default class LeaveLobbyMessage implements IPlayerSocketMessage {
    type: SocketMessageType = SocketMessageType.LEAVE_LOBBY;
    constructor(public connectionId: string) {}

    serialize(): string {
        return JSON.stringify(this);
    }
}