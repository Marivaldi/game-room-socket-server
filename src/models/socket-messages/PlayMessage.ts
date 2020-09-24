import { GameKey } from "../games/enums/GameKey";
import { SocketMessageType } from "./enums/SocketMessageType";
import ISocketMessage from "./interfaces/ISocketMessage";

export default class PlayMessage implements ISocketMessage {
    type: SocketMessageType = SocketMessageType.PLAY;
    gameKey: GameKey;
    lobbyId: string;
    constructor() {}
    serialize(): string {
        return JSON.stringify(this);
    }
}