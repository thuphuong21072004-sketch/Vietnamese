import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { CommonModule } from '@angular/common';

import { LearningService } from '../../../../services/learning.service';

import { TestService } from '../../../../services/test.service';

import { QuizDTO } from '../../../../models/quiz.model';

import { SubmitQuizDTO } from '../../../../models/submit-quiz.model';

import { UnitDTO } from '../../../../models/unit.model';

@Component({
  selector: 'app-unit',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
})
export class QuizLearnComponent implements OnInit, OnDestroy {
  unit!: UnitDTO;

  unitId: number = 0;

  refType: string = 'UNIT';

  refId: number = 0;

  quiz: QuizDTO | null = null;

  showQuiz = false;

  isPassed = false;

  isSubmitted = false;

  previousScore: number = 0;

  currentScore: number = 0;
  wrongCount = 0;

  unansweredCount = 0;

  hasDoneQuiz = false;
  private hasSubmitted = false;

  selectedAnswers: {
    [key: number]: number;
  } = {};

  showResult = false;

  correctCount = 0;

  timeLeft = 0;

  timerText = '00:00';

  timerInterval: any = null;

  isTimeUp = false;

  constructor(
    private route: ActivatedRoute,
    private learningService: LearningService,
    private testService: TestService,
    private router: Router,
  ) {}

  ngOnInit() {
    history.pushState(null, '', location.href);

    window.onpopstate = () => {
      if (!this.isSubmitted) {
        this.forceSubmitQuiz();
      }
    };
    this.route.queryParams.subscribe((params) => {
      this.unitId = +(params['unitId'] || 0);

      this.refType = params['refType'] || 'UNIT';

      this.refId = +(params['refId'] || 0);

      if (this.refType === 'UNIT' && !this.refId) {
        this.refId = this.unitId;
      }

      this.showQuiz = true;

      if (
        this.refType === 'UNIT' ||
        this.refType === 'COURSE_JUMP' ||
        this.refType === 'LEVEL_JUMP'
      ) {
        this.loadunit();

        return;
      }

      if (this.refType === 'PLACEMENT') {
        this.loadQuiz();

        return;
      }
    });
  }

  loadunit() {
    this.learningService.getUnitById(this.unitId).subscribe({
      next: (res) => {
        this.unit = res;

        this.loadQuiz();
      },

      error: () => {
        alert('Failed to load unit');
      },
    });
  }
  loadQuiz() {
    this.testService.getQuiz(this.refId, this.refType).subscribe({
      next: (quizRes) => {
        this.quiz = quizRes;

        if (!this.quiz) {
          return;
        }

        this.testService.getMyQuizResult(this.quiz.quizId).subscribe({
          next: (rs) => {
            if (rs && this.showResult) {
              this.hasDoneQuiz = true;

              this.previousScore = rs.score;

              return;
            }

            this.startTimer();
          },
        });
      },

      error: () => {
        alert('Quiz not found');
      },
    });
  }
  selectAnswer(qId: number, aId: number) {
    this.selectedAnswers[qId] = aId;
  }
  submitQuiz() {
    if (!this.quiz) {
      return;
    }
    this.hasSubmitted = true;
    const allQuestions = this.getAllQuestions();

    const dto: SubmitQuizDTO = {
      quizId: this.quiz.quizId,

      answerIds: Object.values(this.selectedAnswers),
    };

    clearInterval(this.timerInterval);
    localStorage.removeItem(`quiz_end_time_${this.quiz?.quizId}`);
    this.testService.submitQuiz(dto).subscribe({
      next: () => {
        this.loadResult();
      },
    });
  }
  forceSubmitQuiz() {
    if (!this.quiz) {
      return;
    }
    this.hasSubmitted = true;
    const dto: SubmitQuizDTO = {
      quizId: this.quiz.quizId,

      answerIds: Object.values(this.selectedAnswers),
    };

    clearInterval(this.timerInterval);
    localStorage.removeItem(`quiz_end_time_${this.quiz?.quizId}`);

    this.testService.submitQuiz(dto).subscribe({
      next: () => {
        this.loadResult();
      },
    });
  }
  loadResult() {
    if (!this.quiz) {
      return;
    }

    this.testService.getMyQuizResult(this.quiz.quizId).subscribe({
      next: (rs) => {
        if (!rs) {
          return;
        }

        this.currentScore = rs.score;

        this.previousScore = rs.previousScore || rs.score;
        const allQuestions = this.getAllQuestions();

        this.correctCount = 0;

        this.wrongCount = 0;

        this.unansweredCount = 0;

        allQuestions.forEach((q: any) => {
          const selectedId = this.selectedAnswers[q.questionId];

          if (selectedId === undefined || selectedId === null) {
            this.unansweredCount++;

            return;
          }

          const correctAnswer = q.answers.find((a: any) => a.isCorrect);

          if (correctAnswer && selectedId === correctAnswer.answerId) {
            this.correctCount++;
          } else {
            this.wrongCount++;
          }
        });

        if (this.refType === 'PLACEMENT') {
          this.isPassed = true;
        } else {
          this.isPassed = rs.isPassed;
        }

        this.showResult = true;

        this.isSubmitted = true;

        this.hasDoneQuiz = true;
      },
    });
  }
  reviewQuiz() {
    this.showQuiz = true;

    clearInterval(this.timerInterval);

    this.testService.getQuiz(this.refId, this.refType).subscribe((res) => {
      this.quiz = res;

      if (!this.quiz) {
        return;
      }

      this.testService.getMyQuizResult(this.quiz.quizId).subscribe((rs) => {
        if (rs) {
          this.previousScore = rs.score;

          this.currentScore = rs.score;

          this.correctCount = rs.correctCount || 0;

          this.isPassed = rs.isPassed;
        }
      });

      this.testService
        .getUserAnswersRaw(this.quiz.quizId)
        .subscribe((answers) => {
          const answerMap: {
            [key: number]: number;
          } = {};

          const allQuestions = this.getAllQuestions();

          allQuestions.forEach((q) => {
            q.answers.forEach((a: any) => {
              answerMap[a.answerId] = q.questionId;
            });
          });

          this.selectedAnswers = {};

          answers.forEach((ua: any) => {
            const qId = answerMap[ua.answerId];

            if (qId) {
              this.selectedAnswers[qId] = ua.answerId;
            }
          });

          this.showResult = true;

          this.isSubmitted = true;
        });
    });
  }
  retryQuiz() {
    localStorage.removeItem(`quiz_end_time_${this.quiz?.quizId}`);
    this.selectedAnswers = {};

    this.showResult = false;

    this.isSubmitted = false;

    this.isPassed = false;

    this.correctCount = 0;

    this.currentScore = 0;

    this.isTimeUp = false;

    this.startTimer();
  }
  startTimer() {
    if (!this.quiz?.timeLimit) {
      this.timeLeft = 0;

      this.timerText = '';

      return;
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    const duration = this.quiz.timeLimit * 60 * 1000;

    const storageKey = `quiz_end_time_${this.quiz?.quizId}`;

    let endTime = localStorage.getItem(storageKey);

    if (!endTime) {
      endTime = String(Date.now() + duration);

      localStorage.setItem(storageKey, endTime);
    }

    const update = () => {
      if (this.isSubmitted) {
        clearInterval(this.timerInterval);

        return;
      }

      const remain = Math.floor((+endTime! - Date.now()) / 1000);

      this.timeLeft = remain > 0 ? remain : 0;

      this.updateTimerText();

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);

        this.isTimeUp = true;

        this.forceSubmitQuiz();
      }
    };

    update();

    this.timerInterval = setInterval(update, 1000);
  }

  updateTimerText() {
    const minutes = Math.floor(this.timeLeft / 60);

    const seconds = this.timeLeft % 60;

    this.timerText =
      String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  }
  getAllQuestions(): any[] {
    if (!this.quiz) {
      return [];
    }

    const map = new Map<number, any>();

    if (this.quiz.questions?.length) {
      this.quiz.questions.forEach((q: any) => {
        map.set(q.questionId, q);
      });
    }

    if (this.quiz.parts?.length) {
      this.quiz.parts.forEach((part: any) => {
        if (part.questions?.length) {
          part.questions.forEach((q: any) => {
            map.set(q.questionId, q);
          });
        }

        if (part.passages?.length) {
          part.passages.forEach((psg: any) => {
            if (psg.questions?.length) {
              psg.questions.forEach((q: any) => {
                map.set(q.questionId, q);
              });
            }
          });
        }
      });
    }

    return Array.from(map.values());
  }

  getQuestionIndex(question: any): number {
    const allQuestions = this.getAllQuestions();

    return (
      allQuestions.findIndex((x: any) => x.questionId === question.questionId) +
      1
    );
  }

  isCorrectAnswer(q: any, a: any): boolean {
    return a.isCorrect;
  }

  isSelected(q: any, a: any): boolean {
    return this.selectedAnswers[q.questionId] === a.answerId;
  }

  isWrong(q: any, a: any): boolean {
    return this.showResult && this.isSelected(q, a) && !a.isCorrect;
  }

  isUnanswered(q: any): boolean {
    return this.showResult && !this.selectedAnswers[q.questionId];
  }

  goBackCourse() {
    if (this.refType === 'PLACEMENT') {
      this.router.navigate(['/user/tests']);

      return;
    }

    this.router.navigate(['/user/units']);
  }
  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload($event: any) {
    if (!this.isSubmitted && this.quiz && !this.hasSubmitted) {
      this.hasSubmitted = true;

      navigator.sendBeacon(
        'http://localhost:5108/api/tests/submitQuiz',
        new Blob(
          [
            JSON.stringify({
              quizId: this.quiz.quizId,
              answerIds: Object.values(this.selectedAnswers),
            }),
          ],
          {
            type: 'application/json',
          },
        ),
      );
    }
  }
}
