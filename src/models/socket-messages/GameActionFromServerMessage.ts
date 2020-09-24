import { GameKey } from "../games/enums/GameKey";
import { SocketMessageType } from "./enums/SocketMessageType"; 
import { IGameSocketMessage } from "./interfaces/IGameSocketMessage";
import ISocketMessage from "./interfaces/ISocketMessage";

export default class GameActionFromServerMessage implements ISocketMessage {
    type: SocketMessageType = SocketMessageType.GAME_ACTION_FROM_SERVER;
    constructor(public gameMessage: IGameSocketMessage) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}