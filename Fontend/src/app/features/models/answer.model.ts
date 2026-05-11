export interface AnswerDTO {
  answerId: number;

  questionId: number;

  answerText: string;

  isCorrect: boolean;

  imageUrl?: string;

  audioUrl?: string;
  orderIndex: number;

  isDelete: boolean;
}
