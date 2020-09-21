import { SocketMessageType } from "./enums/SocketMessageType";
import ISocketMessage from "./interfaces/ISocketMessage";

export default class GameStartMessage implements ISocketMessage {
    type: SocketMessageType = SocketMessageType.GAME_START;
    constructor() {}

    serialize(): string {
        return JSON.stringify(this);
    }
}