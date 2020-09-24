import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { TriviaGameMessageType } from "./TriviaGameMessageType";

export default class CategoryPickedMessage implements IGameSocketMessage {
    type: TriviaGameMessageType = TriviaGameMessageType.CATEGORY_PICKED;
    connectionId: string;
    category: number;
    constructor() {}
    serialize(): string {
        return JSON.stringify(this);
    }
}