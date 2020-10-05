import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { PhaserGameMessageType } from "./PhaserGameMessageType";

export default class EndVoteMessage implements IGameSocketMessage {
    type: PhaserGameMessageType = PhaserGameMessageType.END_VOTE;
    constructor() {}
    serialize(): string {
        return JSON.stringify(this);
    }
}