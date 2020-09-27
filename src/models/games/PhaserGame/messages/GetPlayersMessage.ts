import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { PhaserGameMessageType } from "./PhaserGameMessageType";

export default class GetPlayersMessage implements IGameSocketMessage {
    type: PhaserGameMessageType = PhaserGameMessageType.GET_PLAYERS;
    constructor(public connectionId) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}