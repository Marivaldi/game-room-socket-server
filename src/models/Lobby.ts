import { POINT_CONVERSION_COMPRESSED } from "constants";
import { Player } from "./Player";
import ISocketMessage from "./socket-messages/interfaces/ISocketMessage";

export default class Lobby {
    static readonly MAX_PLAYERS = 5;
    private players: Player[] = [];
    constructor(public lobbyId) {}

    get hasAvailableSeats(): boolean {
        return this.players.length < Lobby.MAX_PLAYERS;
    }

    send(socketMessage: ISocketMessage) {
        this.players.forEach((player) => {
            player.send(socketMessage);
        });
    }

    connect(player: Player) {
        this.players.push(player);
    }

    disconnect(player: Player) {
        this.players = this.players.filter((connectedPlayer) => connectedPlayer.connectionId !== player.connectionId);
    }
}