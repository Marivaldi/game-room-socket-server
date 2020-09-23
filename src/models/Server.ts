import WebSocket from "ws";
import { Player } from "./Player";
import { v4 as uuidv4 } from 'uuid';
import Lobby from "./Lobby";
import ISocketMessage from "./socket-messages/interfaces/ISocketMessage";
import { SocketMessageType } from "./socket-messages/enums/SocketMessageType";
import LobbyJoinedMessage from "./socket-messages/LobbyJoinedMessage";
import JoinLobbyMessage from "./socket-messages/JoinLobbyMessage";
import SystemChatMessage from "./socket-messages/SystemChatMessage";
import SendLobbyChatMessage from "./socket-messages/SendLobbyChatMessage";
import ReceiveLobbyChatMessage from "./socket-messages/ReceiveLobbyChatMessage";
import GameStartMessage from "./socket-messages/GameStartMessage";
import UserIsTypingMessage from "./socket-messages/UserIsTypingMessage";
import UserStoppedTypingMessage from "./socket-messages/UserStoppedTypingMessage";
import PongMessage from "./socket-messages/PongMessage";
import PingMessage from "./socket-messages/PingMessage";
import { SystemMessageLevel } from "./socket-messages/enums/SystemMessageLevel";
import LobbyHostMessage from "./socket-messages/LobbyHostMessage";

export class Server {
    private webSocketServer: WebSocket.Server;
    private connections = new Map<string, Player>();
    private lobbies = new Map<string, Lobby>();

    constructor() { }

    start() {
        this.webSocketServer = new WebSocket.Server({ port: parseInt(process.env.PORT) });
        this.webSocketServer.on('connection', (socket) => {
            const connectionId = uuidv4();
            socket.on('close', () => this.onPlayerDisconnect(connectionId));
            socket.on('message', (json: string) => this.handleMessage(JSON.parse(json)))
            const player: Player = new Player(connectionId, socket);
            this.connections.set(connectionId, player);
        });
    }

    onPlayerDisconnect = (connectionId: string) => {
        const player: Player = this.connections.get(connectionId);
        if (player.isInALobby()) this.removePlayerFromLobby(player);

        this.connections.delete(connectionId);
    }

    removePlayerFromLobby(player: Player) {
        const lobbyId = player.lobbyId;
        const username = player.username;
        const lobby = this.lobbies.get(lobbyId)
        const theLobbyHasClosed = !lobby;
        if (theLobbyHasClosed) return;

        lobby.disconnect(player);

        if(lobby.isEmpty()) {
            this.lobbies.delete(lobbyId);
            return;
        }

        lobby.send(new SystemChatMessage(`${username} has left the lobby.`, SystemMessageLevel.DANGER));

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
            case SocketMessageType.USER_IS_TYPING:
                this.notifyOtherUsersThatUserIsTyping(message as UserIsTypingMessage);
                break;
            case SocketMessageType.USER_STOPPED_TYPING:
                this.notifyOtherUsersThatUserStoppedTyping(message as UserStoppedTypingMessage);
                break;
            case SocketMessageType.PING:
                this.sendPongToPlayer(message as PingMessage)
        }
    }
    getAvailableLobby(): Lobby {
        for (let lobbyId of this.lobbies.keys()) {
            const lobby = this.lobbies.get(lobbyId);
            if (lobby.hasAvailableSeats) return lobby;
        }
    }

    sendPongToPlayer(message: PingMessage) {
        const player = this.connections.get(message.connectionId)
        if (!player) return;

        player.send(new PongMessage());
    }


    joinRandomLobby(message: JoinLobbyMessage) {
        let lobbyToJoin: Lobby = this.getAvailableLobby();

        const needToCreateANewLobby = !lobbyToJoin;
        if (needToCreateANewLobby) lobbyToJoin = this.createNewLobby();

        const player = this.connections.get(message.connectionId)
        if (!player) return;

        player.username = message.username;
        player.lobbyId =  lobbyToJoin.lobbyId;
        lobbyToJoin.connect(player);

        player.send(new LobbyJoinedMessage(lobbyToJoin.lobbyId));

        lobbyToJoin.send(new SystemChatMessage(`${message.username} has joined the lobby.`, SystemMessageLevel.INFO));

        if(needToCreateANewLobby) {
            player.isLobbyHost = true;
            player.send(new LobbyHostMessage());
        }

        if (lobbyToJoin.isFull) {
            lobbyToJoin.send(new SystemChatMessage(`Lobby is full.`, SystemMessageLevel.SUCCESS));
        };
    }

    sendLobbyChat(message: SendLobbyChatMessage) {
        const lobby: Lobby = this.lobbies.get(message.lobbyId);
        const lobbyNoLongerExists = !lobby;
        if (lobbyNoLongerExists) return;

        const sender = this.connections.get(message.connectionId)
        if (!sender) return;

        lobby.send(new ReceiveLobbyChatMessage(sender.connectionId, sender.username, message.content));

    }

    notifyOtherUsersThatUserIsTyping(message: UserIsTypingMessage) {
        const lobby: Lobby = this.lobbies.get(message.lobbyId);
        const lobbyNoLongerExists = !lobby;
        if (lobbyNoLongerExists) return;

        lobby.sendAndExclude(new UserIsTypingMessage(message.connectionId, message.lobbyId), [message.connectionId]);
    }

    notifyOtherUsersThatUserStoppedTyping(message: UserStoppedTypingMessage) {
        const lobby: Lobby = this.lobbies.get(message.lobbyId);
        const lobbyNoLongerExists = !lobby;
        if (lobbyNoLongerExists) return;

        lobby.sendAndExclude(new UserStoppedTypingMessage(message.connectionId, message.lobbyId), [message.connectionId]);
    }
}