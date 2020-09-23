import { GameKey } from "../games/enums/GameKey";
import { SocketMessageType } from "./enums/SocketMessageType";
import ISocketMessage from "./interfaces/ISocketMessage";

export default class GameStartingMessage implements ISocketMessage {
    type: SocketMessageType = SocketMessageType.GAME_STARTING;
    constructor(public gameKey: GameKey) {}

    serialize(): string {
        return JSON.stringify(this);
    }
}