import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { PhaserGameMessageType } from "./PhaserGameMessageType";

export default class KillPlayerMessage implements IGameSocketMessage {
    type: PhaserGameMessageType = PhaserGameMessageType.KILL_PLAYER;
    connectionId: string;
    serialize(): string {
        return JSON.stringify(this);
    }
}