import { GameKey } from "./enums/GameKey";

export default interface IGame {
    key: GameKey;
    play();
    finish();
}