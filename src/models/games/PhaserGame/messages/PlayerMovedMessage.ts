import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import PlayerPostion from "../PlayerPosition";
import { PhaserGameMessageType } from "./PhaserGameMessageType";

export default class PlayerMovedMessage implements IGameSocketMessage {
    type: PhaserGameMessageType = PhaserGameMessageType.PLAYER_MOVED;
    constructor(public connectionId, public x, public y) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}