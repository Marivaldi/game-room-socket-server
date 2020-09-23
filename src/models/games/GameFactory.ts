import Lobby from "../Lobby";
import { GameKey } from "./enums/GameKey";
import IGame from "./IGame";
import TestGame from "./TestGame/TestGame";

export class GameFactory {
    constructor(){}

    create(gameKey: GameKey, lobby: Lobby): IGame {
        switch (gameKey) {
            case GameKey.TEST_GAME:
                return new TestGame(lobby);
            default:
                return null;
        }
    }
}