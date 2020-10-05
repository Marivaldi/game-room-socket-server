import shuffle from "shuffle-array";
import { TypeState } from "typestate";
import Lobby from "../../Lobby";
import { Player } from "../../Player";
import GameActionFromServerMessage from "../../socket-messages/GameActionFromServerMessage";
import { IGameSocketMessage } from "../../socket-messages/interfaces/IGameSocketMessage";
import { UpdateGameVotesMessage } from "../../socket-messages/UpdateGameVotesMessage";
import { GameKey } from "../enums/GameKey";
import IGame from "../IGame";
import AddPlayersMessage from "./messages/AddPlayersMessage";
import BodyFlaggedMessage from "./messages/BodyFlaggedMessage";
import EndVoteMessage from "./messages/EndVoteMessage";
import GetPlayersMessage from "./messages/GetPlayersMessage";
import KillPlayerMessage from "./messages/KillPlayerMessage";
import { PhaserGameMessageType } from "./messages/PhaserGameMessageType";
import PlayerMovedMessage from "./messages/PlayerMovedMessage";
import PlayerStoppedMessage from "./messages/PlayerStoppedMessage";
import StartVoteMessage from "./messages/StartVoteMessage";
import UpdateVotesMessage from "./messages/UpdateVotesMessage";
import VoteDecisionMessage from "./messages/VoteDecisionMessage";
import VotePlayerMessage from "./messages/VotePlayerMessage";
import PlayerInformation from "./PlayerInformation";

enum PhaserGameState {
    Starting,
    Running,
    BodyFlagged,
    Voting,
    GameOver
}

export default class PhaserGame implements IGame {
    key: GameKey.PHASER_GAME;
    stateMachine: TypeState.FiniteStateMachine<PhaserGameState>;
    players: PlayerInformation[] = [];
    private roles: string[] = ['necromancer', 'default_player', 'hero_1', 'default_player', 'default_player', 'hero_2', 'necromancer'];
    private playerRoles: Map<string, string> = new Map<string, string>();
    private votes: Map<string, string> = new Map<string, string>();

    constructor(private lobby: Lobby) {
        this.stateMachine = new TypeState.FiniteStateMachine<PhaserGameState>(PhaserGameState.Starting);
        this.stateMachine.from(PhaserGameState.Starting).to(PhaserGameState.Running);
        this.stateMachine.from(PhaserGameState.Running).to(PhaserGameState.BodyFlagged);
        this.stateMachine.from(PhaserGameState.BodyFlagged).to(PhaserGameState.Voting);
        this.stateMachine.from(PhaserGameState.BodyFlagged).to(PhaserGameState.GameOver);
        this.stateMachine.from(PhaserGameState.Voting).to(PhaserGameState.GameOver);
        this.stateMachine.from(PhaserGameState.Running).to(PhaserGameState.GameOver);



        const playerIds: string[] = lobby.players.map((player: Player) => player.connectionId);
        shuffle(playerIds);
        for (let i = 0; i < playerIds.length; i++) {
            const connectionId = playerIds[i];
            const role = this.roles[i];
            this.playerRoles.set(connectionId, role);
        }

        this.players = lobby.players.map((player: Player, index: number) => new PlayerInformation(player.connectionId, player.username, `spawn_point${index + 1}`, this.playerRoles.get(player.connectionId)));
    }

    isInProgress(): boolean {
        return !this.stateMachine.is(PhaserGameState.GameOver);
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
                break;
            case PhaserGameMessageType.KILL_PLAYER:
                this.handleKillPlayer(message as KillPlayerMessage);
                break;
            case PhaserGameMessageType.BODY_FLAGGED:
                this.handleBodyFlagged(message as BodyFlaggedMessage);
                break;
            case PhaserGameMessageType.START_VOTE:
                this.handleStartVote(message as StartVoteMessage);
                break;
            case PhaserGameMessageType.VOTE_PLAYER:
                this.handleVotePlayer(message as VotePlayerMessage);
                break;
            case PhaserGameMessageType.END_VOTE:
                this.handleEndVote(message as EndVoteMessage);
                break;
            default:
                break;
        }
    }

    handleGetPlayers(message: GetPlayersMessage) {
        this.lobby.sendToSpecificPlayer(new GameActionFromServerMessage(new AddPlayersMessage(this.players)), message.connectionId);
    }

    handlePlayerMovement(message: PlayerMovedMessage) {
        this.lobby.sendAndExclude(new GameActionFromServerMessage(message), [message.connectionId])
    }

    handlePlayerStopped(message: PlayerStoppedMessage) {
        this.lobby.sendAndExclude(new GameActionFromServerMessage(message), [message.connectionId])
    }

    handleKillPlayer(message: KillPlayerMessage) {
        this.lobby.send(new GameActionFromServerMessage(message));
    }

    handleBodyFlagged(message: BodyFlaggedMessage) {
        if (this.stateMachine.is(PhaserGameState.BodyFlagged)) return;

        this.stateMachine.go(PhaserGameState.BodyFlagged);
        this.lobby.send(new GameActionFromServerMessage(message));
    }


    handleStartVote(message: StartVoteMessage) {
        if (this.stateMachine.is(PhaserGameState.Voting)) return;

        this.stateMachine.go(PhaserGameState.Voting);
        this.lobby.send(new GameActionFromServerMessage(message));
        this.votes = new Map<string, string>();
    }

    handleVotePlayer(message: VotePlayerMessage) {
        this.votes.set(message.voter, message.votedFor);
        const mappedVotes: any = {};
        for (let vote of this.votes.values()) {
            if (mappedVotes.hasOwnProperty(vote)) {
                mappedVotes[vote]++;
            } else {
                mappedVotes[vote] = 1;
            }
        }

        this.lobby.send(new GameActionFromServerMessage(new UpdateVotesMessage(mappedVotes)));
    }

    handleEndVote(message: EndVoteMessage) {
        if (this.stateMachine.is(PhaserGameState.Running)) return;

        const mappedVotes: Map<string, number> = new Map<string, number>();
        for (let vote of this.votes.values()) {
            if (mappedVotes.hasOwnProperty(vote)) {
                let numVotes = mappedVotes.get(vote);
                numVotes++;
            } else {
                mappedVotes.set(vote, 1);
            }
        }

        let mostVotes = [];
        let maxVotes = 0;
        for (let [key, value] of mappedVotes) {
            if (value > maxVotes) {
                mostVotes = [key];
                maxVotes = value;
                continue;
            }

            if (value === maxVotes) {
                mostVotes.push(key);
            }
        }



        if (mostVotes.length === 0) return;

        if (mostVotes.length > 1) {
            this.lobby.send(new GameActionFromServerMessage(new VoteDecisionMessage(true)));
            return;
        }

        this.lobby.send(new GameActionFromServerMessage(new VoteDecisionMessage(false, mostVotes[0])));

    }

    play() {
        if (this.stateMachine.is(PhaserGameState.Running)) { return; }

        const theGameHasNotStarted: boolean = this.stateMachine.canGo(PhaserGameState.Running);
        if (theGameHasNotStarted) { this.stateMachine.go(PhaserGameState.Running); }
    }

    finish() {
        const theGameHasStarted: boolean = this.stateMachine.canGo(PhaserGameState.GameOver);
        if (theGameHasStarted) this.stateMachine.go(PhaserGameState.GameOver);
    }
}