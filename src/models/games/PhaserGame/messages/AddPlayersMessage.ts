import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import PlayerPostion from "../PlayerInformation";
import { PhaserGameMessageType } from "./PhaserGameMessageType";

export default class AddPlayersMessage implements IGameSocketMessage {
    type: PhaserGameMessageType = PhaserGameMessageType.ADD_PLAYERS;
    constructor(public players: PlayerPostion[]) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}