import { IGameSocketMessage } from "../../../socket-messages/interfaces/IGameSocketMessage";
import Answers from "../Answers";
import { TriviaGameMessageType } from "./TriviaGameMessageType";

export default class FinalStandingsMessage implements IGameSocketMessage {
    type: TriviaGameMessageType = TriviaGameMessageType.FINAL_STANDINGS;
    constructor(public standings: any[]) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}