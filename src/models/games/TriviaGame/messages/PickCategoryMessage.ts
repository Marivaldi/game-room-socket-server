import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { TriviaGameMessageType } from "./TriviaGameMessageType";

export default class PickCategoryMessage implements IGameSocketMessage {
    type: TriviaGameMessageType = TriviaGameMessageType.PICK_CATEGORY;
    constructor() {}
    serialize(): string {
        return JSON.stringify(this);
    }
}