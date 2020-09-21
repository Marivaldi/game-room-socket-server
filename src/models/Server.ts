import WebSocket from "ws";
import { Player } from "./Player";
import { v4 as uuidv4 } from 'uuid';
import Lobby from "./Lobby";
import ISocketMessage from "./socket-messages/interfaces/ISocketMessage";
import { SocketMessageType } from "./socket-messages/enums/SocketMessageType";
import LobbyJoinedMessage from "./socket-messages/LobbyJoinedMessage";
import JoinLobbyMessage from "./socket-messages/JoinLobbyMessage";
import SystemChatMessage from "./socket-messages/SystemChatMessage";
import { join } from "path";
import SendLobbyChatMessage from "./socket-messages/SendLobbyChatMessage";
import ReceiveLobbyChatMessage from "./socket-messages/ReceiveLobbyChatMessage";

export class Server {
    private webSocketServer: WebSocket.Server;
    private connections = new Map<string, Player>();
    private lobbies = new Map<string, Lobby>();

    constructor() { }

    start() {
        this.webSocketServer = new WebSocket.Server({ port: 8080 });
        this.webSocketServer.on('connection', (socket) => {
            const connectionId = uuidv4();
            socket.addEventListener('close', () => this.onPlayerDisconnect(connectionId));
            socket.on('message', (json: string) => this.handleMessage(JSON.parse(json)))
            const player: Player = new Player(connectionId, socket);
            this.connections.set(connectionId, player);
        });
    }

    onPlayerDisconnect = (connectionId: string) => {
        const player: Player = this.connections.get(connectionId);
        if (player.isInALobby) this.removePlayerFromLobby(player);

        this.connections.delete(connectionId);
    }

    removePlayerFromLobby(player: Player) {
        const lobby = this.lobbies.get(player.lobbyId)
        const theLobbyHasClosed = !lobby;
        if (theLobbyHasClosed) return;

        lobby.disconnect(player);
    }

    createNewLobby(): Lobby {
        const lobbyId: string = uuidv4();
        const newLobby = new Lobby(lobbyId);
        this.lobbies.set(lobbyId, newLobby);
        return newLobby;
    }

    handleMessage = (message: ISocketMessage) => {
        if (!message || !message.type) return;

        switch (message.type) {
            case SocketMessageType.JOIN_RANDOM_LOBBY:
                this.joinRandomLobby(message as JoinLobbyMessage)
                break;
            case SocketMessageType.SEND_LOBBY_CHAT:
                this.sendLobbyChat(message as SendLobbyChatMessage);
                break;
        }
    }
    getAvailableLobby(): Lobby {
        for (let lobbyId of this.lobbies.keys()) {
            const lobby = this.lobbies.get(lobbyId);
            if (lobby.hasAvailableSeats) return lobby;
        }
    }


    joinRandomLobby(message: JoinLobbyMessage) {
        let lobbyToJoin: Lobby = this.getAvailableLobby();

        const thereIsNoAvailableLobby = !lobbyToJoin;
        if (thereIsNoAvailableLobby) lobbyToJoin = this.createNewLobby();

        const player = this.connections.get(message.connectionId)
        if (!player) return;

        player.username = message.username;
        lobbyToJoin.connect(player);

        player.send(new LobbyJoinedMessage(lobbyToJoin.lobbyId));

        lobbyToJoin.send(new SystemChatMessage(`${message.username} has joined the lobby.`));
    }

    sendLobbyChat(message: SendLobbyChatMessage) {
        const lobby: Lobby = this.lobbies.get(message.lobbyId);
        const lobbyNoLongerExists = !lobby;
        if (lobbyNoLongerExists) return;

        const sender = this.connections.get(message.connectionId)
        if (!sender) return;

        lobby.send(new ReceiveLobbyChatMessage(sender.connectionId, sender.username, message.content));

    }
}