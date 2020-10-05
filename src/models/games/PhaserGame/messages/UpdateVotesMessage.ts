import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { PhaserGameMessageType } from "./PhaserGameMessageType";

export default class UpdateVotesMessage implements IGameSocketMessage {
    type: PhaserGameMessageType = PhaserGameMessageType.UPDATE_VOTES;
    constructor(public votes: any) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}