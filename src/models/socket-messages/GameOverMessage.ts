import { SocketMessageType } from "./enums/SocketMessageType";
import ISocketMessage from "./interfaces/ISocketMessage";

export default class GameOverMessage implements ISocketMessage {
    type: SocketMessageType = SocketMessageType.GAME_OVER;
    constructor(public winners: string[]) {}

    serialize(): string {
        return JSON.stringify(this);
    }
}