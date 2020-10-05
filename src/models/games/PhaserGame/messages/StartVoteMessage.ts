import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { PhaserGameMessageType } from "./PhaserGameMessageType";

export default class StartVoteMessage implements IGameSocketMessage {
    type: PhaserGameMessageType = PhaserGameMessageType.START_VOTE;
    constructor() {}
    serialize(): string {
        return JSON.stringify(this);
    }
}