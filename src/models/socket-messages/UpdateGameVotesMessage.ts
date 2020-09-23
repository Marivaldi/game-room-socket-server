import { GameVote } from "../games/GameVote";
import { SocketMessageType } from "./enums/SocketMessageType";
import ISocketMessage from "./interfaces/ISocketMessage";

export class UpdateGameVotesMessage implements ISocketMessage{
    type: SocketMessageType = SocketMessageType.UPDATE_GAME_VOTES;
    constructor(public votes: GameVote[]) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}