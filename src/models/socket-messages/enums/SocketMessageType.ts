export enum SocketMessageType {
    CONNECTED = "CONNECTED",
    JOIN_RANDOM_LOBBY = "JOIN_RANDOM_LOBBY",
    LOBBY_JOINED = "LOBBY_JOINED",
    RECEIVE_LOBBY_CHAT = "RECEIVE_LOBBY_CHAT",
    SEND_LOBBY_CHAT  =  "SEND_LOBBY_CHAT",
    GAME_STARTING = "GAME_STARTING",
    USER_IS_TYPING = "USER_IS_TYPING",
    USER_STOPPED_TYPING = "USER_STOPPED_TYPING",
    PING = "PING",
    PONG = "PONG",
    LOBBY_HOST = "LOBBY_HOST",
    VOTE_FOR_GAME ="VOTE_FOR_GAME",
    UPDATE_GAME_VOTES = "UPDATE_GAME_VOTES",
    START_GAME = "START_GAME"
}