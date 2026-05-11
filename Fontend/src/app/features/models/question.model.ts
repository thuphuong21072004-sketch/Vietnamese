import { AnswerDTO } from './answer.model';

export interface QuestionDTO {
  questionId: number;

  quizId: number;

  partId?: number;

  passageId?: number;

  questionText: string;

  imageUrl?: string;

  audioUrl?: string;

  orderIndex: number;

  score: number;

  isDelete: boolean;

  answers: AnswerDTO[];
}
