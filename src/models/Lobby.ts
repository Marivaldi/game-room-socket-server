import { POINT_CONVERSION_COMPRESSED } from "constants";
import IGame from "./games/IGame";
import { Player } from "./Player";
import { SystemMessageLevel } from "./socket-messages/enums/SystemMessageLevel";
import GameStartMessage from "./socket-messages/GameStartMessage";
import ISocketMessage from "./socket-messages/interfaces/ISocketMessage";
import LobbyHostMessage from "./socket-messages/LobbyHostMessage";
import SystemChatMessage from "./socket-messages/SystemChatMessage";

export default class Lobby {
    static readonly MAX_PLAYERS = 5;
    private players: Player[] = [];
    private game: IGame;
    constructor(public lobbyId) {}

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

    sendAndExclude(socketMessage: ISocketMessage, playersToExclude: string[]) {
        if(!playersToExclude || playersToExclude.length === 0) {
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
        if(player.isLobbyHost) this.pickNewHostFromRemainingPlayers();
    }

    isEmpty(): boolean {
        return this.players.length === 0;
    }

    private pickNewHostFromRemainingPlayers() {
        if(this.players.length === 0) return;

        const index = this.randomPlayerIndex();
        this.players[index].isLobbyHost = true;
        this.players[index].send(new LobbyHostMessage());
        this.send(new SystemChatMessage(`${this.players[index].username} is now the host.`, SystemMessageLevel.INFO));
    }

    private randomPlayerIndex() {
        return Math.floor(Math.random() * this.players.length); 
    }
}