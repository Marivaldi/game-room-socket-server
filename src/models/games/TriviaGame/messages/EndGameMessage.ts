import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { TriviaGameMessageType } from "./TriviaGameMessageType";

export default class AnswerQuestionMessage implements IGameSocketMessage {
    type: TriviaGameMessageType = TriviaGameMessageType.END_GAME;
    constructor() {}
    serialize(): string {
        return JSON.stringify(this);
    }
}