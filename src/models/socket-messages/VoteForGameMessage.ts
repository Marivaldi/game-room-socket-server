import { GameKey } from "../games/enums/GameKey";
import { SocketMessageType } from "./enums/SocketMessageType";
import IPlayerSocketMessage from "./interfaces/IPlayerSocketMessage";

export default class VoteForGameMessage implements IPlayerSocketMessage {
    type: SocketMessageType = SocketMessageType.VOTE_FOR_GAME;
    constructor(public connectionId: string, public lobbyId: string, public gameKey: GameKey) {}
    serialize(): string {
        return JSON.stringify(this);
    }
}