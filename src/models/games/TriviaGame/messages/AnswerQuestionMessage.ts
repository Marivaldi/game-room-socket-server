import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { TriviaGameMessageType } from "./TriviaGameMessageType";

export default class AnswerQuestionMessage implements IGameSocketMessage {
    type: TriviaGameMessageType = TriviaGameMessageType.ANSWER_QUESTION;
    connectionId: string;
    answerWasCorrect: boolean = false;
    constructor() {}
    serialize(): string {
        return JSON.stringify(this);
    }
}