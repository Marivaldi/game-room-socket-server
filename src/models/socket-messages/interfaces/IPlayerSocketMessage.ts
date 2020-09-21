import ISocketMessage from "./ISocketMessage";

export default interface IPlayerSocketMessage extends ISocketMessage {
    connectionId: string;
}