import { GameKey } from "./games/enums/GameKey";
import { GameFactory } from "./games/GameFactory";
import { GameVote } from "./games/GameVote";
import IGame from "./games/IGame";
import { Player } from "./Player";
import { SystemMessageLevel } from "./socket-messages/enums/SystemMessageLevel";
import GameStartingMessage from "./socket-messages/GameStartingMessage";
import { IGameSocketMessage } from "./socket-messages/interfaces/IGameSocketMessage";
import ISocketMessage from "./socket-messages/interfaces/ISocketMessage";
import LobbyHostMessage from "./socket-messages/LobbyHostMessage";
import SystemChatMessage from "./socket-messages/SystemChatMessage";
import VoteForGameMessage from "./socket-messages/VoteForGameMessage";

export default class Lobby {
    static readonly MAX_PLAYERS = 5;
    players: Player[] = [];
    isPrivate: boolean = false;
    private gameFactory: GameFactory = new GameFactory();
    private game: IGame;
    private gameVotes: Map<GameKey, string[]> = new Map<GameKey, string[]>();

    constructor(public lobbyId) { }

    get hasAvailableSeats(): boolean {
        return this.players.length < Lobby.MAX_PLAYERS;
    }

    get isFull(): boolean {
        return this.players.length === Lobby.MAX_PLAYERS;
    }

    send(socketMessage: ISocketMessage) {
        this.players.forEach((player) => {
            player.send(socketMessage);
        });
    }

    sendToSpecificPlayer(socketMessage: ISocketMessage, connectionId: string) {
        const player: Player = this.players.find((player: Player) => player.connectionId === connectionId);
        if (!player) return;

        player.send(socketMessage);
    }

    sendAndExclude(socketMessage: ISocketMessage, playersToExclude: string[]) {
        if (!playersToExclude || playersToExclude.length === 0) {
            this.send(socketMessage);
            return;
        }

        const relevantPlayers: Player[] = this.players.filter((player: Player) => !playersToExclude.includes(player.connectionId));

        relevantPlayers.forEach((player) => {
            player.send(socketMessage);
        });
    }

    connect(player: Player) {
        this.players.push(player);
    }

    disconnect(player: Player) {
        this.players = this.players.filter((connectedPlayer) => connectedPlayer.connectionId !== player.connectionId);
        if (player.isLobbyHost) this.pickNewHostFromRemainingPlayers();

        this.removePlayersVotes(player.connectionId);
    }

    isEmpty(): boolean {
        return this.players.length === 0;
    }

    voteForGame(connectionId: string, gameKey: GameKey) {
        if (this.gameVotes.has(gameKey)) {
            this.gameVotes.get(gameKey).push(connectionId);
            return;
        }

        this.gameVotes.set(gameKey, [connectionId]);
    }

    getGameVotes(): GameVote[] {
        const keys = this.gameVotes.keys();
        let votes: GameVote[] = [];
        for (let key of keys) {
            const amountOfVotes = this.gameVotes.get(key).length;
            votes.push({ key: key, votes: amountOfVotes });
        }

        return votes;
    }

    removePlayersVotes(connectionId: string) {
        const keys = this.gameVotes.keys();
        for (let key of keys) {
            const playerVotes = this.gameVotes.get(key);
            const withoutPlayer = playerVotes.filter((voterConnectionId) => voterConnectionId !== connectionId);
            this.gameVotes.set(key, withoutPlayer);
        }
    }

    startGame(gameKey: GameKey) {
        this.game = this.gameFactory.create(gameKey, this);
        this.send(new GameStartingMessage(gameKey));
    }

    pressPlay() {
        if (!this.game) return;

        this.game.play();
    }

    passGameMessage(gameMessage: IGameSocketMessage) {
        this.game.handleMessage(gameMessage)
    }

    lobbyUsername(connectionId: string) {
        const player: Player = this.players.find((player: Player) => player.connectionId === connectionId);
        if (!player) return "";

        return player.username;
    }

    isJoinable(): boolean {
        return this.hasAvailableSeats && this.noGamesAreRunning();
    }

    noGamesAreRunning(): boolean {
        if(!this.game) return true;

        return !this.game.isInProgress();
    }

    private pickNewHostFromRemainingPlayers() {
        if (this.players.length === 0) return;

        const index = this.randomPlayerIndex();
        this.players[index].isLobbyHost = true;
        this.players[index].send(new LobbyHostMessage());
        this.send(new SystemChatMessage(`${this.players[index].username} is now the host.`, SystemMessageLevel.INFO));
    }

    private randomPlayerIndex() {
        return Math.floor(Math.random() * this.players.length);
    }
}