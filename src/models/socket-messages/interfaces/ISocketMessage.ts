import { SocketMessageType } from "../enums/SocketMessageType";

export default interface ISocketMessage {
    type: SocketMessageType;
    serialize(): string;
}