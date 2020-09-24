import { TypeState } from "typestate";
import Lobby from "../../Lobby";
import { Player } from "../../Player";
import GameOverMessage from "../../socket-messages/GameOverMessage";
import { IGameSocketMessage } from "../../socket-messages/interfaces/IGameSocketMessage";
import { GameKey } from "../enums/GameKey";
import IGame from "../IGame";
import AnswerQuestionMessage from "./messages/AnswerQuestionMessage";
import { TriviaGameMessageType } from "./messages/TriviaGameMessageType";
import  shuffle from 'shuffle-array';
import GameActionFromServerMessage from "../../socket-messages/GameActionFromServerMessage";
import WaitForCategoryMessage from "./messages/WaitForCategoryMessage";
import PickCategoryMessage from "./messages/PickCategoryMessage";
import * as rm from "typed-rest-client";
import { Http2ServerResponse } from "http2";
import CategoryPickedMessage from "./messages/CategoryPickedMessage";
import ShowQuestionMessage from "./messages/ShowQuestionMessage";

enum TriviaGameState {
    Starting,
    CategorySelection,
    WaitingForAnswers,
    ShowingFinalStandings,
    GameOver
}

export default class TriviaGame implements IGame {
    key: GameKey.TEST_GAME;
    stateMachine: TypeState.FiniteStateMachine<TriviaGameState>;
    private static readonly NUMBER_OF_ROUNDS = 5;
    private playerAnswers: Map<string, Answers> = new Map<string, Answers>();
    private playerOrder: string[] = [];
    private currentCategoryPicker: number = 0;

    constructor(private lobby: Lobby) {
        this.stateMachine = new TypeState.FiniteStateMachine<TriviaGameState>(TriviaGameState.Starting);
        this.stateMachine.from(TriviaGameState.Starting).to(TriviaGameState.CategorySelection);
        this.stateMachine.from(TriviaGameState.CategorySelection).to(TriviaGameState.WaitingForAnswers);
        this.stateMachine.from(TriviaGameState.WaitingForAnswers).to(TriviaGameState.CategorySelection);
        this.stateMachine.from(TriviaGameState.WaitingForAnswers).to(TriviaGameState.ShowingFinalStandings);
        this.stateMachine.from(TriviaGameState.ShowingFinalStandings).to(TriviaGameState.GameOver);

        lobby.players.forEach((player : Player) => this.playerAnswers.set(player.connectionId, new Answers()));
        this.playerOrder = lobby.players.map((player : Player) => player.connectionId);
        shuffle(this.playerOrder);
    }

    handleMessage(message: IGameSocketMessage) {
        switch(message.type) {
            case TriviaGameMessageType.ANSWER_QUESTION:
                this.handleAnswerQuestion(message as AnswerQuestionMessage);
                break;
            case TriviaGameMessageType.CATEGORY_PICKED:
                this.handleCategoryPicked(message as CategoryPickedMessage);
                break;
        }
    }

    play() {
        const theGameHasNotStarted: boolean = this.stateMachine.canGo(TriviaGameState.CategorySelection);
        if(theGameHasNotStarted) this.stateMachine.go(TriviaGameState.CategorySelection);
        this.sendPickCategoryMessages();
    }

    finish() {
        const theGameHasNotStarted: boolean = this.stateMachine.canGo(TriviaGameState.GameOver);
        if(theGameHasNotStarted) this.stateMachine.go(TriviaGameState.GameOver);
    }

    private async handleCategoryPicked(message: CategoryPickedMessage) {
        const triviaQuestion = await this.getTriviaQuestionFromAPI(message.category);
        this.sendTriviaQuestionToPlayers(triviaQuestion)
    }

    private handleAnswerQuestion(message: AnswerQuestionMessage) {
        if(message.answerWasCorrect) {
            this.playerAnswers.get(message.connectionId).correct += 1;
        } else {
            this.playerAnswers.get(message.connectionId).incorrect +=1;
        }
    }

    private backToChoosingCategory() {
        const canGoToCategorySelection: boolean = this.stateMachine.canGo(TriviaGameState.CategorySelection);
        if(canGoToCategorySelection) this.stateMachine.go(TriviaGameState.CategorySelection);

        this.setNextCategoryPicker();
        this.sendPickCategoryMessages();
    }

    private sendPickCategoryMessages() {
        this.sendMessageToCategoryPicker();
        this.sendMessageToEveryoneElse();
    }

    private notifyPlayersOfWinner(winnerId: string) {
        const username: string = this.lobby.lobbyUsername(winnerId);
        this.lobby.send(new GameOverMessage([username]));
    }

    private setNextCategoryPicker() {
        this.currentCategoryPicker = (this.currentCategoryPicker === this.playerOrder.length - 1) ? 0 : this.currentCategoryPicker++;
    }

    private sendMessageToCategoryPicker() {
        const pickerId : string = this.playerOrder[this.currentCategoryPicker];
        this.lobby.sendToSpecificPlayer(new GameActionFromServerMessage(new PickCategoryMessage()), pickerId);
    }

    private sendMessageToEveryoneElse() {
        const pickerId : string = this.playerOrder[this.currentCategoryPicker];
        const categoryPickerName: string = this.lobby.lobbyUsername(pickerId);
        this.lobby.sendAndExclude(new GameActionFromServerMessage(new WaitForCategoryMessage(categoryPickerName)), [pickerId]);
    }

    private async getTriviaQuestionFromAPI(category: number) {
        let rest: rm.RestClient = new rm.RestClient('', 'https://opentdb.com');
        const response: rm.IRestResponse<any> = await rest.get<any>(`api.php?amount=1&category=${category}`,);
        return response.result;
    }

    private sendTriviaQuestionToPlayers(triviaQuestion: any) {
        this.lobby.send(new GameActionFromServerMessage(new ShowQuestionMessage(triviaQuestion)));
    }
}

class Answers {
    correct: number = 0;
    incorrect: number = 0;
}
