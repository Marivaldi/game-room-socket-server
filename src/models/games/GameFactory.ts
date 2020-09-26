import Lobby from "../Lobby";
import { GameKey } from "./enums/GameKey";
import IGame from "./IGame";
import PhaserGame from "./PhaserGame/PhaserGame";
import TestGame from "./TestGame/TestGame";
import TriviaGame from "./TriviaGame/TriviaGame";

export class GameFactory {
    constructor(){}

    create(gameKey: GameKey, lobby: Lobby): IGame {
        switch (gameKey) {
            case GameKey.TEST_GAME:
                return new TestGame(lobby);
            case GameKey.TRIVIA_GAME:
                return new TriviaGame(lobby);
            case GameKey.PHASER_GAME:
                return new PhaserGame(lobby);
            default:
                return null;
        }
    }
}