import { GameKey } from "./enums/GameKey";
import IGame from "./IGame";
import TestGame from "./TestGame/TestGame";

export class GameFactory {
    constructor(){}

    create(gameKey: GameKey): IGame {
        switch (gameKey) {
            case GameKey.TEST_GAME:
                return new TestGame();
            default:
                return null;
        }
    }
}