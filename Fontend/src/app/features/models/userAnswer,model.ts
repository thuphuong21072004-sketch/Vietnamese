export interface UserAnswerDTO {
  userAnswerId: number;

  userQuizId: number;

  questionId: number;

  answerId: number;

  questionText?: string;

  answerText?: string;

  isCorrect: boolean;
}
