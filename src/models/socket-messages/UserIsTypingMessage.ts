import { SocketMessageType } from "./enums/SocketMessageType";
import IPlayerSocketMessage from "./interfaces/IPlayerSocketMessage";

export default class UserIsTypingMessage implements IPlayerSocketMessage {
    type: SocketMessageType = SocketMessageType.USER_IS_TYPING;
    constructor(public connectionId: string, public lobbyId: string) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}