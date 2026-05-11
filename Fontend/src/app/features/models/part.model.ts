import { PassageDTO } from './passage.model';
import { QuestionDTO } from './question.model';

export interface PartDTO {
  partId: number;

  partName: string;

  partNumber: number;

  instruction?: string;

  questions: QuestionDTO[];

  passages: PassageDTO[];

  mode?: 'question' | 'passage';
}
