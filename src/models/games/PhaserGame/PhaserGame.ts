import shuffle from "shuffle-array";
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
import PlayerInformation from "./PlayerInformation";
import PlayerPostion from "./PlayerInformation";

enum TestGameState {
    Starting,
    InProgress,
    GameOver
}

export default class PhaserGame implements IGame {
    key: GameKey.PHASER_GAME;
    stateMachine: TypeState.FiniteStateMachine<TestGameState>;
    playerPositions: PlayerPostion[] = [];
    private roles: string[] = ['necromancer', 'default_player', 'hero_1', 'default_player', 'default_player', 'hero_2', 'necromancer'];
    private playerRoles: Map<string, string> = new Map<string, string>();
    constructor(private lobby: Lobby) {
        this.stateMachine = new TypeState.FiniteStateMachine<TestGameState>(TestGameState.Starting);
        this.stateMachine.from(TestGameState.Starting).to(TestGameState.InProgress);
        this.stateMachine.from(TestGameState.InProgress).to(TestGameState.GameOver);
        const playerIds: string[] = lobby.players.map((player: Player) => player.connectionId);
        shuffle(playerIds);
        for(let i = 0; i < playerIds.length; i++) {
            const connectionId = playerIds[i];
            const role = this.roles[i];
            this.playerRoles.set(connectionId, role);
        }

        this.playerPositions = lobby.players.map((player: Player, index: number) => new PlayerInformation(player.connectionId, player.username, `spawn_point${index+1}`, this.playerRoles.get(player.connectionId)));
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