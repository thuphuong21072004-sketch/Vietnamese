
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TestService } from '../../../../services/test.service';
import { BaseService } from '../../../../services/base.service';
import { LearningService } from '../../../../services/learning.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css'],
})
export class QuizComponent implements OnChanges {
  @Input() refId!: number;

  @Input() refType!: string;

  loading = false;

  quiz: any = null;

  constructor(
    private testService: TestService,
    private learningService: LearningService,
    private baseService: BaseService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['refId']?.currentValue && changes['refType']?.currentValue) {
      this.loadQuiz();
    }
  }

  loadQuiz() {
    this.loading = true;

    this.testService.getQuiz(this.refId, this.refType).subscribe({
      next: (res: any) => {
        this.loading = false;

        if (res) {
          this.quiz = res;

          this.quiz.questions ??= [];

          this.quiz.parts ??= [];

          this.quiz.quizMode = null;

          if (this.quiz.parts && this.quiz.parts.length > 0) {
            this.quiz.quizMode = 'part';
          }
          else if (this.quiz.questions && this.quiz.questions.length > 0) {
            this.quiz.quizMode = 'question';
          }

          this.quiz.questions.forEach((q: any) => {
            q.answers ??= [];
          });
          this.quiz.parts.forEach((part: any) => {
            part.questions ??= [];

            part.passages ??= [];
            if (part.questions.length > 0) {
              part.mode = 'question';
            } else if (part.passages.length > 0) {
              part.mode = 'passage';
            } else {
              part.mode = null;
            }
            part.questions.forEach((q: any) => {
              q.answers ??= [];
            });
            part.passages.forEach((psg: any) => {
              psg.questions ??= [];

              psg.questions.forEach((q: any) => {
                q.answers ??= [];
              });
            });
          });
        } else {
          this.quiz = null;
        }
      },

      error: (err) => {
        this.loading = false;

        this.baseService.handleError(err, 'Failed to load quiz');
      },
    });
  }

  addQuiz() {
    this.quiz = {
      quizId: 0,

      refType: this.refType,

      refId: this.refId,

      quizName: '',

      timeLimit: null,

      passScore: 70,

      isActive: true,

      quizMode: null,

      questions: [],

      parts: [],
    };
  }

  addQuestionToQuiz() {
    this.quiz.quizMode = 'question';

    this.quiz.questions.push(this.createQuestion(null, null));
  }

  addQuestionToPart(part: any) {
    part.mode = 'question';

    part.questions.push(this.createQuestion(part.partId, null));
  }

  addQuestionToPassage(passage: any, partId: number) {
    passage.questions.push(this.createQuestion(partId, passage.passageId));
  }

  createQuestion(partId: number | null, passageId: number | null) {
    return {
      questionId: 0,

      quizId: this.quiz.quizId,

      partId,

      passageId,

      questionText: '',

      imageUrl: null,

      audioUrl: null,

      orderIndex: 1,

      score: 1,

      isDelete: false,

      answers: [this.createAnswer(0), this.createAnswer(1)],
    };
  }

  deleteQuestion(question: any, list: any[]) {
    const index = list.indexOf(question);

    if (index >= 0) {
      list.splice(index, 1);
    }
  }

  createAnswer(index: number) {
    return {
      answerId: 0,

      questionId: 0,

      answerText: '',

      isCorrect: index === 0,

      imageUrl: null,

      audioUrl: null,

      answerLabel: String.fromCharCode(65 + index),

      orderIndex: index + 1,

      isDelete: false,
    };
  }

  addAnswer(question: any) {
    const activeAnswers = question.answers.filter((a: any) => !a.isDelete);

    const nextIndex = activeAnswers.length;

    question.answers.push({
      answerId: 0,

      questionId: question.questionId,

      answerText: '',

      isCorrect: false,

      imageUrl: null,

      audioUrl: null,

      answerLabel: String.fromCharCode(65 + nextIndex),

      orderIndex: nextIndex + 1,

      isDelete: false,
    });
  }

  deleteAnswer(question: any, index: number) {
    question.answers.splice(index, 1);

    question.answers.forEach((a: any, i: number) => {
      a.answerLabel = String.fromCharCode(65 + i);
    });
  }

  selectCorrectAnswer(question: any, answer: any) {
    question.answers.forEach((a: any) => {
      a.isCorrect = false;
    });

    answer.isCorrect = true;
  }

  addPart() {
    this.quiz.quizMode = 'part';

    this.quiz.parts.push({
      partId: 0,

      quizId: this.quiz.quizId,

      partNumber: this.quiz.parts.length + 1,

      partName: 'Part ' + (this.quiz.parts.length + 1),

      instruction: '',

      isDelete: false,

      mode: null,

      questions: [],

      passages: [],
    });
  }

  deletePart(part: any) {
    const index = this.quiz.parts.indexOf(part);

    if (index >= 0) {
      this.quiz.parts.splice(index, 1);
    }
  }

  addPassage(part: any) {
    part.mode = 'passage';

    part.passages.push({
      passageId: 0,

      partId: part.partId,

      content: '',

      imageUrl: null,

      audioUrl: null,

      orderIndex: part.passages.length + 1,

      isDelete: false,

      questions: [],
    });
  }

  deletePassage(psg: any, part: any) {
    const index = part.passages.indexOf(psg);

    if (index >= 0) {
      part.passages.splice(index, 1);
    }
  }

  handleMediaUpload(event: any, target: any) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const formData = new FormData();

    formData.append('file', file);

    this.learningService.uploadMedia(formData).subscribe({
      next: (res: any) => {
        if (res.folder === 'images') {
          target.imageUrl = res.fileName;
        }

        if (res.folder === 'audios') {
          target.audioUrl = res.fileName;
        }
      },

      error: (err) => {
        this.baseService.handleError(err, 'Media upload failed');
      },
    });
  }

  saveQuiz() {
    this.testService.saveQuiz(this.quiz).subscribe({
      next: () => {
        alert('Quiz saved successfully');

        this.loadQuiz();
      },

      error: (err) => {
        this.baseService.handleError(err, 'Failed to save quiz');
      },
    });
  }

  deleteQuiz() {
    if (!confirm('Delete this quiz?')) {
      return;
    }

    this.testService.deleteQuiz(this.quiz.quizId).subscribe({
      next: () => {
        alert('Quiz deleted');

        this.quiz = null;
      },

      error: (err) => {
        this.baseService.handleError(err, 'Delete failed');
      },
    });
  }

  get totalScore(): number {
    if (!this.quiz) {
      return 0;
    }

    let total = 0;

    this.quiz.questions?.forEach((q: any) => {
      if (!q.isDelete) {
        total += q.score || 0;
      }
    });

    this.quiz.parts?.forEach((part: any) => {
      
      part.questions?.forEach((q: any) => {
        if (!q.isDelete) {
          total += q.score || 0;
        }
      });

      part.passages?.forEach((psg: any) => {
        psg.questions?.forEach((q: any) => {
          if (!q.isDelete) {
            total += q.score || 0;
          }
        });
      });
    });

    return total;
  }
  getQuestionIndex(question: any): number {
    let allQuestions: any[] = [];

    if (this.quiz?.questions) {
      allQuestions.push(...this.quiz.questions.filter((x: any) => !x.isDelete));
    }

    if (this.quiz?.parts) {
      this.quiz.parts.forEach((part: any) => {
        if (part.questions) {
          allQuestions.push(...part.questions.filter((x: any) => !x.isDelete));
        }

        if (part.passages) {
          part.passages.forEach((psg: any) => {
            if (psg.questions) {
              allQuestions.push(
                ...psg.questions.filter((x: any) => !x.isDelete),
              );
            }
          });
        }
      });
    }

    return allQuestions.indexOf(question) + 1;
  }
}
