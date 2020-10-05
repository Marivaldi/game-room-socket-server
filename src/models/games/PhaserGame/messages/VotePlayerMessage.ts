import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { PhaserGameMessageType } from "./PhaserGameMessageType";

export default class VotePlayerMessage implements IGameSocketMessage {
    type: PhaserGameMessageType = PhaserGameMessageType.VOTE_PLAYER;
    constructor(public voter: string, public votedFor: string) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}