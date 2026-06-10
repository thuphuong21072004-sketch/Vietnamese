export interface SpecialAnswerDTO {
  questionId: number;
  text?: string;
  speakScore?: number;
}

export interface SubmitQuizDTO {
  quizId: number;
  answerIds: number[];
  specialAnswers: SpecialAnswerDTO[];
}
