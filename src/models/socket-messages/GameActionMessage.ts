import { GameKey } from "../games/enums/GameKey";
import { SocketMessageType } from "./enums/SocketMessageType";
import { IGameSocketMessage } from "./interfaces/IGameSocketMessage";
import IPlayerSocketMessage from "./interfaces/IPlayerSocketMessage";

export default class GameActionMessage implements IPlayerSocketMessage {
    type: SocketMessageType = SocketMessageType.GAME_ACTION;
    gameKey: GameKey;
    lobbyId: string;
    gameMessage: IGameSocketMessage;
    connectionId: string;
    constructor() {}
    serialize(): string {
        return JSON.stringify(this);
    }
}