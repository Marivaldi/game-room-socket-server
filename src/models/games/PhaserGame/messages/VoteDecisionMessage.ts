import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { PhaserGameMessageType } from "./PhaserGameMessageType";

export default class VoteDecisionMessage implements IGameSocketMessage {
    type: PhaserGameMessageType = PhaserGameMessageType.VOTE_DECISION;
    constructor(public tie: boolean, public votedOff?: string) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}