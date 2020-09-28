import { TypeState } from "typestate";
import Lobby from "../../Lobby";
import { Player } from "../../Player";
import GameActionFromServerMessage from "../../socket-messages/GameActionFromServerMessage";
import GameOverMessage from "../../socket-messages/GameOverMessage";
import { IGameSocketMessage } from "../../socket-messages/interfaces/IGameSocketMessage";
import { GameKey } from "../enums/GameKey";
import IGame from "../IGame";
import AddPlayersMessage from "./messages/AddPlayersMessage";
import GetPlayersMessage from "./messages/GetPlayersMessage";
import { PhaserGameMessageType } from "./messages/PhaserGameMessageType";
import PlayerMovedMessage from "./messages/PlayerMovedMessage";
import PlayerStoppedMessage from "./messages/PlayerStoppedMessage";
import PlayerPostion from "./PlayerPosition";

enum TestGameState {
    Starting,
    InProgress,
    GameOver
}

export default class PhaserGame implements IGame {
    key: GameKey.PHASER_GAME;
    stateMachine: TypeState.FiniteStateMachine<TestGameState>;
    playerPositions: PlayerPostion[] = [];
    constructor(private lobby: Lobby) {
        this.stateMachine = new TypeState.FiniteStateMachine<TestGameState>(TestGameState.Starting);
        this.stateMachine.from(TestGameState.Starting).to(TestGameState.InProgress);
        this.stateMachine.from(TestGameState.InProgress).to(TestGameState.GameOver);
        this.playerPositions = lobby.players.map((player: Player) => new PlayerPostion(player.connectionId, player.username, 0, 0));
    }

    isInProgress(): boolean {
        return !this.stateMachine.is(TestGameState.GameOver);
    }

    handleMessage(message: IGameSocketMessage) {
        switch (message.type) {
            case PhaserGameMessageType.PLAYER_MOVED:
                this.handlePlayerMovement(message as PlayerMovedMessage);
                break;
            case PhaserGameMessageType.PLAYER_STOPPED:
                this.handlePlayerStopped(message as PlayerStoppedMessage);
                break;
            case PhaserGameMessageType.GET_PLAYERS:
                this.handleGetPlayers(message as GetPlayersMessage);
            default:
                break;
        }
    }

    handleGetPlayers(message: GetPlayersMessage){
        this.lobby.sendToSpecificPlayer(new GameActionFromServerMessage(new AddPlayersMessage(this.playerPositions)), message.connectionId);
    }

    handlePlayerMovement(message: PlayerMovedMessage) {
        this.lobby.sendAndExclude(new GameActionFromServerMessage(message), [message.connectionId])
    }

    handlePlayerStopped(message: PlayerStoppedMessage) {
        this.lobby.sendAndExclude(new GameActionFromServerMessage(message), [message.connectionId])
    }

    play() {
        if (this.stateMachine.is(TestGameState.InProgress)) { return; }

        const theGameHasNotStarted: boolean = this.stateMachine.canGo(TestGameState.InProgress);
        if (theGameHasNotStarted) { this.stateMachine.go(TestGameState.InProgress); }
    }

    finish() {
        const theGameHasStarted: boolean = this.stateMachine.canGo(TestGameState.GameOver);
        if (theGameHasStarted) this.stateMachine.go(TestGameState.GameOver);
    }
}