import WebSocket from "ws";
import ConnectedMessage from "./socket-messages/ConnectedMessage";
import ISocketMessage from "./socket-messages/interfaces/ISocketMessage";

export class Player {
    public lobbyId: string;
    public username: string;
    
    constructor(public connectionId: string, private socket: WebSocket) {
        this.acknowledgeConnection();
    }

    get isInALobby():boolean {
        return this.lobbyId && this.lobbyId !== "";
    }

    send(socketMessage: ISocketMessage) {
        this.socket.send(socketMessage.serialize());
    }

    // onMessage = (json: string) => {
    //     const message: ISocketMessage = JSON.parse(json);
    //     if (!message || !message.type)  return;


    //         case "SEND_LOBBY_CHAT":
    //             const sender = get_lobby_username(message.lobby_id, connection_id);
    //             send_message_to_lobby(message.lobby_id, message.message, sender, connection_id)
    //             break;
    //     }
    // }

    private acknowledgeConnection() {
        this.send(new ConnectedMessage(this.connectionId));
    }

}