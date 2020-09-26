import { TypeState } from "typestate";
import Lobby from "../../Lobby";
import GameOverMessage from "../../socket-messages/GameOverMessage";
import { IGameSocketMessage } from "../../socket-messages/interfaces/IGameSocketMessage";
import { GameKey } from "../enums/GameKey";
import IGame from "../IGame";
import FirstClickMessage from "./messages/FirstClickMessage";
import { TestGameMessageType } from "./messages/TestGameMessageType";

enum TestGameState {
    Starting,
    InProgress,
    GameOver
}

export default class TestGame implements IGame {
    key: GameKey.TEST_GAME;
    stateMachine: TypeState.FiniteStateMachine<TestGameState>;
    constructor(private lobby: Lobby) {
        this.stateMachine = new TypeState.FiniteStateMachine<TestGameState>(TestGameState.Starting);
        this.stateMachine.from(TestGameState.Starting).to(TestGameState.InProgress);
        this.stateMachine.from(TestGameState.InProgress).to(TestGameState.GameOver);
    }

    isInProgress(): boolean {
        return !this.stateMachine.is(TestGameState.GameOver);
    }

    handleMessage(message: IGameSocketMessage) {
        switch(message.type) {
            case TestGameMessageType.FIRST_CLICK:
                this.handleFirstClick(message as FirstClickMessage);
                break;
        }
    }

    play() {
        const theGameHasNotStarted: boolean = this.stateMachine.canGo(TestGameState.InProgress);
        if(theGameHasNotStarted) this.stateMachine.go(TestGameState.InProgress);
    }

    finish() {
        const theGameHasNotStarted: boolean = this.stateMachine.canGo(TestGameState.GameOver);
        if(theGameHasNotStarted) this.stateMachine.go(TestGameState.GameOver);
    }


    private handleFirstClick(message: FirstClickMessage) {
        this.finish();
        this.notifyPlayersOfWinner(message.connectionId);
    }

    private notifyPlayersOfWinner(winnerId: string) {
        const username: string = this.lobby.lobbyUsername(winnerId);
        this.lobby.send(new GameOverMessage([username]));
    }
}