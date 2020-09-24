import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import { TriviaGameMessageType } from "./TriviaGameMessageType";

export default class ShowQuestionMessage implements IGameSocketMessage {
    type: TriviaGameMessageType = TriviaGameMessageType.SHOW_QUESTION;
    constructor(public triviaQuestion: any) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}