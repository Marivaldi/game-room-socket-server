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
import GameStartMessage from "./socket-messages/GameStartingMessage";
import UserIsTypingMessage from "./socket-messages/UserIsTypingMessage";
import UserStoppedTypingMessage from "./socket-messages/UserStoppedTypingMessage";
import PongMessage from "./socket-messages/PongMessage";
import PingMessage from "./socket-messages/PingMessage";
import { SystemMessageLevel } from "./socket-messages/enums/SystemMessageLevel";
import LobbyHostMessage from "./socket-messages/LobbyHostMessage";
import VoteForGameMessage from "./socket-messages/VoteForGameMessage";
import { GameVote } from "./games/GameVote";
import { UpdateGameVotesMessage } from "./socket-messages/UpdateGameVotesMessage";
import StartGameMessage from "./socket-messages/StartGameMesssage";
import GameActionMessage from "./socket-messages/GameActionMessage";
import PlayMessage from "./socket-messages/PlayMessage";
import CreatePrivateLobbyMessage from "./socket-messages/CreatePrivateLobbyMessage";
import { env } from "process";
import LeaveLobbyMessage from "./socket-messages/LeaveLobbyMessage";
import JoinSpecificLobbyMessage from "./socket-messages/JoinSpecificLobbyMessage";

export class Server {
    private webSocketServer: WebSocket.Server;
    private connections = new Map<string, Player>();
    private lobbies = new Map<string, Lobby>();

    constructor() { }

    start() {
        this.webSocketServer = new WebSocket.Server({ port: parseInt(process.env.PORT) });
        this.webSocketServer.on('connection', (socket, request) => {
            const theConnectionIsFromAnInvalidOrigin = (!request.headers.origin || request.headers.origin !== env.ORIGIN);
            if (theConnectionIsFromAnInvalidOrigin) {
                socket.terminate();
                return;
            }

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

        if (lobby.isEmpty()) {
            this.lobbies.delete(lobbyId);
            return;
        }

        lobby.send(new SystemChatMessage(`${username} has left the lobby.`, SystemMessageLevel.DANGER));
        lobby.send(new UpdateGameVotesMessage(lobby.getGameVotes()));

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
            case SocketMessageType.JOIN_LOBBY:
                this.joinSpecificLobby(message as JoinSpecificLobbyMessage)
                break;
            case SocketMessageType.LEAVE_LOBBY:
                this.leaveLobby(message as LeaveLobbyMessage);
                break;
            case SocketMessageType.CREATE_PRIVATE_LOBBY:
                this.createPrivateLobby(message as CreatePrivateLobbyMessage);
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
                this.sendPongToPlayer(message as PingMessage);
                break;
            case SocketMessageType.VOTE_FOR_GAME:
                this.voteForGameAndPushToPlayers(message as VoteForGameMessage);
                break;
            case SocketMessageType.START_GAME:
                this.startGame(message as StartGameMessage)
                break;
            case SocketMessageType.PLAY:
                this.pressPlay(message as PlayMessage);
                break;
            case SocketMessageType.GAME_ACTION:
                this.handleGameAction(message as GameActionMessage)
                break;
        }
    }
    getAvailableLobby(): Lobby {
        for (let lobbyId of this.lobbies.keys()) {
            const lobby = this.lobbies.get(lobbyId);
            if (!lobby.isPrivate && lobby.isJoinable()) return lobby;
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
        player.lobbyId = lobbyToJoin.lobbyId;
        lobbyToJoin.connect(player);

        player.send(new LobbyJoinedMessage(lobbyToJoin.lobbyId));

        lobbyToJoin.send(new SystemChatMessage(`${message.username} has joined the lobby.`, SystemMessageLevel.INFO));

        if (needToCreateANewLobby) {
            player.isLobbyHost = true;
            player.send(new LobbyHostMessage());
        }

        if (lobbyToJoin.isFull) {
            lobbyToJoin.send(new SystemChatMessage(`Lobby is full.`, SystemMessageLevel.SUCCESS));
        };

        this.updateGameVotes(lobbyToJoin);
    }

    joinSpecificLobby(message: JoinSpecificLobbyMessage) {
        const lobbyToJoin: Lobby = this.lobbies.get(message.lobbyId);
        const lobbyNoLongerExists = !lobbyToJoin;
        if (lobbyNoLongerExists) return;

        const player = this.connections.get(message.connectionId)
        if (!player) return;

        if(lobbyToJoin.isFull) return;

        player.username = message.username;
        player.lobbyId = lobbyToJoin.lobbyId;
        lobbyToJoin.connect(player);

        player.send(new LobbyJoinedMessage(lobbyToJoin.lobbyId));

        lobbyToJoin.send(new SystemChatMessage(`${message.username} has joined the lobby.`, SystemMessageLevel.INFO));

        this.updateGameVotes(lobbyToJoin);
    }

    leaveLobby(message: LeaveLobbyMessage) {
        const player: Player = this.connections.get(message.connectionId);
        if (player.isInALobby()) this.removePlayerFromLobby(player);
    }

    createPrivateLobby(message: CreatePrivateLobbyMessage) {
        const newLobby: Lobby = this.createNewLobby();
        newLobby.isPrivate = true;

        const player = this.connections.get(message.connectionId)
        if (!player) return;

        player.username = message.username;
        player.lobbyId = newLobby.lobbyId;
        newLobby.connect(player);

        player.send(new LobbyJoinedMessage(newLobby.lobbyId));

        newLobby.send(new SystemChatMessage(`${message.username} has joined the lobby.`, SystemMessageLevel.INFO));

        player.isLobbyHost = true;
        player.send(new LobbyHostMessage());
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

    voteForGameAndPushToPlayers(message: VoteForGameMessage) {
        const lobby: Lobby = this.lobbies.get(message.lobbyId);
        const lobbyNoLongerExists = !lobby;
        if (lobbyNoLongerExists) return;

        lobby.voteForGame(message.connectionId, message.gameKey);
        this.updateGameVotes(lobby);
    }

    updateGameVotes(lobby: Lobby) {
        const gameVotes: GameVote[] = lobby.getGameVotes();
        lobby.send(new UpdateGameVotesMessage(gameVotes));
    }

    startGame(message: StartGameMessage) {
        const lobby: Lobby = this.lobbies.get(message.lobbyId);
        const lobbyNoLongerExists = !lobby;
        if (lobbyNoLongerExists) return;

        lobby.startGame(message.gameKey);
    }

    pressPlay(message: PlayMessage) {
        const lobby: Lobby = this.lobbies.get(message.lobbyId);
        const lobbyNoLongerExists = !lobby;
        if (lobbyNoLongerExists) return;

        lobby.pressPlay();
    }

    handleGameAction(message: GameActionMessage) {
        const lobby: Lobby = this.lobbies.get(message.lobbyId);
        const lobbyNoLongerExists = !lobby;
        if (lobbyNoLongerExists) return;

        lobby.passGameMessage(message.gameMessage);
    }
}