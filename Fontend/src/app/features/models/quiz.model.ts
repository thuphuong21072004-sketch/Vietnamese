import { PartDTO } from './part.model';
import { QuestionDTO } from './question.model';

export interface QuizDTO {
  quizId: number;

  refType: string;

  refId: number;

  quizName: string;

  timeLimit?: number;

  passScore?: number;

  isActive: boolean;

  questions: QuestionDTO[];

  parts: PartDTO[];

  quizMode?: 'question' | 'part';
}
