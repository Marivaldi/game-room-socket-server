import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { PhaserGameMessageType } from "./PhaserGameMessageType";

export default class BodyFlaggedMessage implements IGameSocketMessage {
    type: PhaserGameMessageType = PhaserGameMessageType.BODY_FLAGGED;
    constructor() {}
    serialize(): string {
        return JSON.stringify(this);
    }
}