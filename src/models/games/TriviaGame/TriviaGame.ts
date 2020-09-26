import { TypeState } from "typestate";
import Lobby from "../../Lobby";
import { Player } from "../../Player";
import GameOverMessage from "../../socket-messages/GameOverMessage";
import { IGameSocketMessage } from "../../socket-messages/interfaces/IGameSocketMessage";
import { GameKey } from "../enums/GameKey";
import IGame from "../IGame";
import AnswerQuestionMessage from "./messages/AnswerQuestionMessage";
import { TriviaGameMessageType } from "./messages/TriviaGameMessageType";
import shuffle from 'shuffle-array';
import GameActionFromServerMessage from "../../socket-messages/GameActionFromServerMessage";
import WaitForCategoryMessage from "./messages/WaitForCategoryMessage";
import PickCategoryMessage from "./messages/PickCategoryMessage";
import * as rm from "typed-rest-client";
import { Http2ServerResponse } from "http2";
import CategoryPickedMessage from "./messages/CategoryPickedMessage";
import ShowQuestionMessage from "./messages/ShowQuestionMessage";
import Answers from "./Answers";
import FinalStandingsMessage from "./messages/FinalStandingsMessage";

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
    private static readonly NUMBER_OF_ROUNDS = 2;
    private playerAnswers: Map<string, Answers> = new Map<string, Answers>();
    private playerOrder: string[] = [];
    private currentCategoryPicker: number = 0;
    private recievedAnswersForRound: number = 0;
    private rounds: number = 1;
    constructor(private lobby: Lobby) {
        this.stateMachine = new TypeState.FiniteStateMachine<TriviaGameState>(TriviaGameState.Starting);
        this.stateMachine.from(TriviaGameState.Starting).to(TriviaGameState.CategorySelection);
        this.stateMachine.from(TriviaGameState.CategorySelection).to(TriviaGameState.WaitingForAnswers);
        this.stateMachine.from(TriviaGameState.WaitingForAnswers).to(TriviaGameState.CategorySelection);
        this.stateMachine.from(TriviaGameState.WaitingForAnswers).to(TriviaGameState.GameOver);

        lobby.players.forEach((player: Player) => this.playerAnswers.set(player.connectionId, new Answers()));
        this.playerOrder = lobby.players.map((player: Player) => player.connectionId);
        shuffle(this.playerOrder);
    }

    isInProgress(): boolean {
        return !this.stateMachine.is(TriviaGameState.GameOver);
    }

    handleMessage(message: IGameSocketMessage) {
        switch (message.type) {
            case TriviaGameMessageType.ANSWER_QUESTION:
                this.handleAnswerQuestion(message as AnswerQuestionMessage);
                break;
            case TriviaGameMessageType.CATEGORY_PICKED:
                this.handleCategoryPicked(message as CategoryPickedMessage);
                break;
            case TriviaGameMessageType.END_GAME:
                this.finish();
                break;
        }
    }

    play() {
        const theGameHasNotStarted: boolean = this.stateMachine.canGo(TriviaGameState.CategorySelection);
        if (theGameHasNotStarted) this.stateMachine.go(TriviaGameState.CategorySelection);
        this.sendPickCategoryMessages();
    }

    finish() {
        const theGameHasNotStarted: boolean = this.stateMachine.canGo(TriviaGameState.GameOver);
        if (theGameHasNotStarted) this.stateMachine.go(TriviaGameState.GameOver);
        const winnerIds: string[] = this.findWinners();
        this.notifyPlayersOfWinner(winnerIds);
    }

    private async handleCategoryPicked(message: CategoryPickedMessage) {
        const triviaQuestion = await this.getTriviaQuestionFromAPI(message.category);
        this.sendTriviaQuestionToPlayers(triviaQuestion)
    }

    private handleAnswerQuestion(message: AnswerQuestionMessage) {
        if (message.answerWasCorrect) {
            this.playerAnswers.get(message.connectionId).correct += 1;
        } else {
            this.playerAnswers.get(message.connectionId).incorrect += 1;
        }

        this.recievedAnswersForRound++

        const theServerHasRecveivedAllAnswers: boolean = this.recievedAnswersForRound === this.playerOrder.length;
        if (theServerHasRecveivedAllAnswers) {
            if (this.rounds === TriviaGame.NUMBER_OF_ROUNDS) {
                this.sendFinalStandings();
                return;
            }

            this.rounds++;
            this.backToChoosingCategory();
            this.recievedAnswersForRound = 0;
        }
    }

    private sendFinalStandings() {
        const finalStandings: any[] = this.getFinalStandings();
        this.lobby.send(new GameActionFromServerMessage(new FinalStandingsMessage(finalStandings)));
    }

    private getFinalStandings(): any[]{
        const standings: any[] = [];
        for(let [key, value] of this.playerAnswers) {
            const username = this.lobby.lobbyUsername(key);
            standings.push({player: username, correctAnswers: value.correct, incorrectAnswers: value.incorrect});
        }
        return standings.sort((a, b) => a.correct - b.correct);
    }

    private findWinners(): string[] {
        let winningPlayers: string[] = [];
        let mostCorrectAnswers: number = 0;
        this.playerAnswers.forEach((value: Answers, key: string) => {
            if (value.correct > mostCorrectAnswers) {
                mostCorrectAnswers = value.correct;
                winningPlayers = [key];
            } else if (value.correct === mostCorrectAnswers) {
                winningPlayers.push(key);
            }
        });

        return winningPlayers;
    }

    private backToChoosingCategory() {
        const canGoToCategorySelection: boolean = this.stateMachine.canGo(TriviaGameState.CategorySelection);
        if (canGoToCategorySelection) this.stateMachine.go(TriviaGameState.CategorySelection);

        this.setNextCategoryPicker();
        this.sendPickCategoryMessages();
    }

    private sendPickCategoryMessages() {
        this.sendMessageToCategoryPicker();
        this.sendMessageToEveryoneElse();
    }

    private notifyPlayersOfWinner(winnerIds: string[]) {
        const usernames: string[] = winnerIds.map((winnerId: string) => this.lobby.lobbyUsername(winnerId));
        this.lobby.send(new GameOverMessage(usernames));
    }

    private setNextCategoryPicker() {
        if (this.currentCategoryPicker === (this.playerOrder.length - 1)) {
            this.currentCategoryPicker = 0;
        } else {
            this.currentCategoryPicker++;
        }
    }

    private sendMessageToCategoryPicker() {
        const pickerId: string = this.playerOrder[this.currentCategoryPicker];
        this.lobby.sendToSpecificPlayer(new GameActionFromServerMessage(new PickCategoryMessage()), pickerId);
    }

    private sendMessageToEveryoneElse() {
        const pickerId: string = this.playerOrder[this.currentCategoryPicker];
        const categoryPickerName: string = this.lobby.lobbyUsername(pickerId);
        this.lobby.sendAndExclude(new GameActionFromServerMessage(new WaitForCategoryMessage(categoryPickerName)), [pickerId]);
    }

    private async getTriviaQuestionFromAPI(category: number) {
        let rest: rm.RestClient = new rm.RestClient('', 'https://opentdb.com');
        const response: rm.IRestResponse<any> = await rest.get<any>(`api.php?amount=1&category=${category}&difficulty=medium`,);
        return response.result;
    }

    private sendTriviaQuestionToPlayers(triviaQuestion: any) {
        this.lobby.send(new GameActionFromServerMessage(new ShowQuestionMessage(triviaQuestion)));
        if(this.stateMachine.canGo(TriviaGameState.WaitingForAnswers)) this.stateMachine.go(TriviaGameState.WaitingForAnswers);
    }
}