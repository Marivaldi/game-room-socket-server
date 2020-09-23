import { TypeState } from "typestate";
import { GameKey } from "../enums/GameKey";
import IGame from "../IGame";

enum TestGameState {
    Starting,
    InProgress,
    GameOver
}

export default class TestGame implements IGame {
    key: GameKey.TEST_GAME;
    stateMachine: TypeState.FiniteStateMachine<TestGameState>;
    constructor() {
        this.stateMachine = new TypeState.FiniteStateMachine<TestGameState>(TestGameState.Starting);
        this.stateMachine.from(TestGameState.Starting).to(TestGameState.InProgress);
        this.stateMachine.from(TestGameState.InProgress).to(TestGameState.GameOver);
    }

    play() {
        const theGameHasNotStarted: boolean = this.stateMachine.canGo(TestGameState.InProgress);
        if(theGameHasNotStarted) this.stateMachine.go(TestGameState.InProgress);
    }

    finish() {
        const theGameHasNotStarted: boolean = this.stateMachine.canGo(TestGameState.GameOver);
        if(theGameHasNotStarted) this.stateMachine.go(TestGameState.GameOver);
    }
}