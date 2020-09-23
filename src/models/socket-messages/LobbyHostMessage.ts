import { SocketMessageType } from "./enums/SocketMessageType";
import ISocketMessage from "./interfaces/ISocketMessage";

export default class LobbyHostMessage implements ISocketMessage {
    type: SocketMessageType = SocketMessageType.LOBBY_HOST;
    constructor() {}

    serialize(): string {
        return JSON.stringify(this);
    }
}