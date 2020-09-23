import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { TestGameMessageType } from "./TestGameMessageType";

export default class FirstClickMessage implements IGameSocketMessage {
    type: TestGameMessageType = TestGameMessageType.FIRST_CLICK;
    connectionId: string;
    constructor() {}
    serialize(): string {
        return JSON.stringify(this);
    }
}