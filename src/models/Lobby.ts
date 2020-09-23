import { POINT_CONVERSION_COMPRESSED } from "constants";
import IGame from "./games/IGame";
import { Player } from "./Player";
import GameStartMessage from "./socket-messages/GameStartMessage";
import ISocketMessage from "./socket-messages/interfaces/ISocketMessage";

export default class Lobby {
    static readonly MAX_PLAYERS = 2;
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
    }

    isEmpty(): boolean {
        return this.players.length === 0;
    }
}