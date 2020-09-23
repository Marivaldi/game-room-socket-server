import { IGameSocketMessage } from "../socket-messages/interfaces/IGameSocketMessage";
import ISocketMessage from "../socket-messages/interfaces/ISocketMessage";
import { GameKey } from "./enums/GameKey";

export default interface IGame {
    key: GameKey;
    play();
    finish();
    handleMessage(message: IGameSocketMessage);
}