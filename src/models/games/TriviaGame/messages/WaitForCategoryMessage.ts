import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { TriviaGameMessageType } from "./TriviaGameMessageType";

export default class WaitForCategoryMessage implements IGameSocketMessage {
    type: TriviaGameMessageType = TriviaGameMessageType.WAIT_FOR_CATEGORY;
    constructor(public picker: string) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}