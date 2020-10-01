import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { PhaserGameMessageType } from "./PhaserGameMessageType";

export default class PlayerStoppedMessage implements IGameSocketMessage {
    type: PhaserGameMessageType = PhaserGameMessageType.PLAYER_STOPPED;
    constructor(public connectionId) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}