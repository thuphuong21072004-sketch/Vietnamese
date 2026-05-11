import { QuestionDTO } from './question.model';

export interface PassageDTO {
  passageId: number;

  partId: number;

  content: string;

  imageUrl?: string;

  audioUrl?: string;

  orderIndex: number;

  isDelete: boolean;

  questions: QuestionDTO[];
}
