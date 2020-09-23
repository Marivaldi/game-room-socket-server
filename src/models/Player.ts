import WebSocket from "ws";
import ConnectedMessage from "./socket-messages/ConnectedMessage";
import ISocketMessage from "./socket-messages/interfaces/ISocketMessage";

export class Player {
    public lobbyId: string = "";
    public username: string;
    public isLobbyHost: boolean = false;

    constructor(public connectionId: string, private socket: WebSocket) {
        this.acknowledgeConnection();
    }

    isInALobby():boolean {
        return (!!this.lobbyId && this.lobbyId !== "");
    }

    send(socketMessage: ISocketMessage) {
        this.socket.send(socketMessage.serialize());
    }

    private acknowledgeConnection() {
        this.send(new ConnectedMessage(this.connectionId));
    }

}