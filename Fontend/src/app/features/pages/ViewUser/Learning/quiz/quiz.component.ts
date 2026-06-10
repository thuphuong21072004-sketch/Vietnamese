import { Component, OnInit, OnDestroy, HostListener, NgZone } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { forkJoin, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { LearningService } from '../../../../services/learning.service';

import { TestService } from '../../../../services/test.service';

import { QuizDTO } from '../../../../models/quiz.model';

import { SubmitQuizDTO, SpecialAnswerDTO } from '../../../../models/submit-quiz.model';

import { UnitDTO } from '../../../../models/unit.model';

import { environment } from '../../../../../../environments/environment';

import { AsrService, WordResult } from '../../../../services/asr.service';
import { TtsService } from '../../../../services/tts.service';

interface PronunciationState {
  isRecording: boolean;
  isTranscribing: boolean;
  score?: number;
  wordResults: WordResult[];
  mediaRecorder?: MediaRecorder;
  audioChunks: Blob[];
  recordedAudioUrl?: string;
  ttsAudioUrl?: string;
}

interface WritingState {
  isChecking: boolean;
  score?: number;
  wordResults: WordResult[];
}

@Component({
  selector: 'app-unit',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  selectedAnswers: { [key: number]: number } = {};

  pronunciationStates: { [qId: number]: PronunciationState } = {};

  writingAnswers: { [qId: number]: string | undefined } = {};

  writingStates: { [qId: number]: WritingState } = {};

  showResult = false;

  showResultSummary = false;

  placementLevel = '';
  showPlacementModal = false;
  isStartingLearning = false;

  activePart = 0;
  activeQuestion = 0;

  flaggedQuestions = new Set<number>();

  correctCount = 0;

  timeLeft = 0;

  timerText = '00:00';

  timerInterval: any = null;

  isTimeUp = false;

  constructor(
    private route: ActivatedRoute,
    private learningService: LearningService,
    private testService: TestService,
    public router: Router,
    private asr: AsrService,
    private tts: TtsService,
    private zone: NgZone,
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

      if (this.refType === 'UNIT') {
        this.loadunit();

        return;
      }

      if (
        this.refType === 'COURSE_JUMP' ||
        this.refType === 'LEVEL_JUMP' ||
        this.refType === 'PLACEMENT'
      ) {
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

  selectPart(index: number) {
    this.activePart = index;
    setTimeout(() => document.querySelector('.part-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  toggleFlag(qId: number) {
    if (this.flaggedQuestions.has(qId)) this.flaggedQuestions.delete(qId);
    else this.flaggedQuestions.add(qId);
  }

  goToQuestion(partIndex: number, qId: number) {
    if (this.activePart !== partIndex) {
      this.activePart = partIndex;
      setTimeout(() => document.getElementById('q-' + qId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    } else {
      document.getElementById('q-' + qId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  goToFlatQuestion(qId: number) {
    const idx = this.quiz?.questions?.findIndex((q: any) => q.questionId === qId) ?? -1;
    if (idx >= 0) this.activeQuestion = idx;
  }

  selectQuestion(index: number) {
    this.activeQuestion = index;
    setTimeout(() => document.querySelector('.part-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  getPartQuestionsFlat(part: any): any[] {
    return this.getPartQuestions(part);
  }

  answeredInPart(part: any): number {
    const questions = this.getPartQuestions(part);
    return questions.filter((q: any) => this.isQuestionAnswered(q)).length;
  }

  totalInPart(part: any): number {
    return this.getPartQuestions(part).length;
  }

  getPartQuestions(part: any): any[] {
    const qs: any[] = [];
    if (part.questions?.length) qs.push(...part.questions);
    if (part.passages?.length) {
      part.passages.forEach((p: any) => { if (p.questions?.length) qs.push(...p.questions); });
    }
    return qs;
  }

  isQuestionAnswered(q: any): boolean {
    if (q.questionType === 'PRONUNCIATION') {
      return this.pronunciationStates[q.questionId]?.score !== undefined;
    }
    if (q.questionType === 'WRITING') {
      return !!(this.writingAnswers[q.questionId] || '').trim();
    }
    return this.selectedAnswers[q.questionId] !== undefined;
  }

  isUnanswered(q: any): boolean {
    return this.showResult && !this.isQuestionAnswered(q);
  }

  getCorrectAnswerText(q: any): string {
    return q.answers?.find((a: any) => a.isCorrect)?.answerText || '';
  }

  isWritingCorrect(q: any): boolean {
    const state = this.writingStates[q.questionId];
    return !!state && state.score !== undefined && state.score >= 80;
  }

  isPronunciationCorrect(q: any): boolean {
    const state = this.pronunciationStates[q.questionId];
    return !!state && state.score !== undefined && state.score >= 80;
  }

  /* ── Pronunciation TTS for review ──────────── */
  private fetchPronTts(q: any) {
    const state = this.getPronState(q.questionId);
    if (state.ttsAudioUrl || !q.questionText) return;
    this.tts.synthesize(q.questionText).subscribe({
      next: (res) => {
        const base = environment.apiBaseUrl.replace(/\/api$/, '');
        state.ttsAudioUrl = `${base}${res.audioUrl}`;
      },
      error: () => {}
    });
  }

  /* ── Writing check ──────────────────────────── */
  getWritingState(qId: number): WritingState {
    if (!this.writingStates[qId]) {
      this.writingStates[qId] = { isChecking: false, wordResults: [] };
    }
    return this.writingStates[qId];
  }

  checkWriting(q: any) {
    const text = (this.writingAnswers[q.questionId] || '').trim();
    if (!text) return;
    const ref: string = q.answers?.find((a: any) => a.isCorrect)?.answerText || '';
    const state = this.getWritingState(q.questionId);
    state.isChecking = true;
    state.score = undefined;
    state.wordResults = [];
    this.asr.compareText(text, ref).subscribe({
      next: (res) => {
        state.score = res.score;
        state.wordResults = res.words ?? [];
        state.isChecking = false;
      },
      error: () => { state.isChecking = false; }
    });
  }

  /* ── Pronunciation recording ──────────────────── */
  getPronState(qId: number): PronunciationState {
    if (!this.pronunciationStates[qId]) {
      this.pronunciationStates[qId] = { isRecording: false, isTranscribing: false, wordResults: [], audioChunks: [] };
    }
    return this.pronunciationStates[qId];
  }

  togglePronunciationRecording(q: any) {
    const state = this.getPronState(q.questionId);
    if (state.isRecording) {
      this.stopPronunciationRecording(q);
    } else {
      this.startPronunciationRecording(q);
    }
  }

  private startPronunciationRecording(q: any) {
    const state = this.getPronState(q.questionId);
    state.audioChunks = [];
    state.score = undefined;
    state.wordResults = [];

    const mime = ['audio/webm;codecs=opus', 'audio/webm', '']
      .find(t => !t || MediaRecorder.isTypeSupported(t)) ?? '';

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      state.mediaRecorder = recorder;

      recorder.addEventListener('dataavailable', (e: BlobEvent) => {
        if (e.data?.size > 0) state.audioChunks.push(e.data);
      });

      recorder.addEventListener('stop', () => {
        stream.getTracks().forEach(t => t.stop());
        this.zone.run(async () => {
          if (!state.audioChunks.length) return;
          const webmBlob = new Blob(state.audioChunks, { type: recorder.mimeType || 'audio/webm' });
          try {
            const wavBlob = await this.convertToWav(webmBlob);
            if (state.recordedAudioUrl) URL.revokeObjectURL(state.recordedAudioUrl);
            state.recordedAudioUrl = URL.createObjectURL(wavBlob);
            state.isTranscribing = true;
            const refText: string = q.questionText || '';
            this.asr.grade(wavBlob, refText, 'wav').subscribe({
              next: (res) => {
                state.score = res.score;
                state.wordResults = res.words ?? [];
                state.isTranscribing = false;
              },
              error: () => {
                state.isTranscribing = false;
              }
            });
          } catch {
            state.isTranscribing = false;
          }
        });
      });

      recorder.start(100);
      this.zone.run(() => { state.isRecording = true; });
    }).catch(() => {
      alert('Cannot access microphone. Please check your browser permissions.');
    });
  }

  private stopPronunciationRecording(q: any) {
    const state = this.pronunciationStates[q.questionId];
    if (!state) return;
    if (state.mediaRecorder?.state !== 'inactive') {
      state.mediaRecorder?.requestData();
      state.mediaRecorder?.stop();
    }
    state.isRecording = false;
  }

  private async convertToWav(blob: Blob): Promise<Blob> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    await audioCtx.close();

    const numSamples = audioBuffer.length;
    const pcm = audioBuffer.getChannelData(0);
    const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(wavBuffer);
    const write = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };

    write(0, 'RIFF'); view.setUint32(4, 36 + numSamples * 2, true);
    write(8, 'WAVE'); write(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);  view.setUint32(24, 16000, true);
    view.setUint32(28, 32000, true); view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); write(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    let off = 44;
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, pcm[i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  /* ── Submit ──────────────────────────────────── */
  submitQuiz() {
    if (!this.quiz) return;
    this.hasSubmitted = true;

    const unchecked = this.getAllQuestions().filter(q =>
      q.questionType === 'WRITING' &&
      (this.writingAnswers[q.questionId] || '').trim() &&
      this.writingStates[q.questionId]?.score === undefined
    );

    if (unchecked.length) {
      const checks = unchecked.map(q => {
        const text = (this.writingAnswers[q.questionId] || '').trim();
        const ref = q.answers?.find((a: any) => a.isCorrect)?.answerText || '';
        return this.asr.compareText(text, ref).pipe(
          tap(res => {
            const state = this.getWritingState(q.questionId);
            state.score = res.score;
            state.wordResults = res.words ?? [];
          }),
          catchError(() => of(null))
        );
      });
      forkJoin(checks).subscribe(() => this._doSubmit());
    } else {
      this._doSubmit();
    }
  }

  forceSubmitQuiz() {
    if (!this.quiz) return;
    this.hasSubmitted = true;
    this._doSubmit();
  }

  private _doSubmit() {
    if (!this.quiz) return;
    const specialAnswers = this.buildSpecialAnswers();
    const dto: SubmitQuizDTO = {
      quizId: this.quiz.quizId,
      answerIds: Object.values(this.selectedAnswers),
      specialAnswers,
    };
    clearInterval(this.timerInterval);
    localStorage.removeItem(`quiz_end_time_${this.quiz?.quizId}`);
    this.testService.submitQuiz(dto).subscribe({
      next: () => { this.loadResult(); },
    });
  }

  private buildSpecialAnswers(): SpecialAnswerDTO[] {
    const result: SpecialAnswerDTO[] = [];
    for (const [qId, state] of Object.entries(this.pronunciationStates)) {
      if (state.score !== undefined) {
        result.push({ questionId: +qId, speakScore: state.score });
      }
    }
    for (const [qId, state] of Object.entries(this.writingStates)) {
      if (state.score !== undefined) {
        result.push({ questionId: +qId, speakScore: state.score });
      }
    }
    return result;
  }

  loadResult() {
    if (!this.quiz) return;

    this.testService.getMyQuizResult(this.quiz.quizId).subscribe({
      next: (rs) => {
        if (!rs) return;

        this.currentScore = rs.score;
        this.previousScore = rs.previousScore || rs.score;
        const allQuestions = this.getAllQuestions();

        this.correctCount = 0;
        this.wrongCount = 0;
        this.unansweredCount = 0;

        allQuestions.forEach((q: any) => {
          if (q.questionType === 'PRONUNCIATION') {
            const state = this.pronunciationStates[q.questionId];
            if (!state || state.score === undefined) {
              this.unansweredCount++;
            } else if (state.score >= 80) {
              this.correctCount++;
            } else {
              this.wrongCount++;
            }
            return;
          }
          if (q.questionType === 'WRITING') {
            const state = this.writingStates[q.questionId];
            if (!state || state.score === undefined) {
              this.unansweredCount++;
            } else if (state.score >= 80) {
              this.correctCount++;
            } else {
              this.wrongCount++;
            }
            return;
          }

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

        this.isPassed = this.refType === 'PLACEMENT' ? true : rs.isPassed;
        this.showResultSummary = true;
        this.showResult = true;
        this.isSubmitted = true;
        this.hasDoneQuiz = true;

        this.getAllQuestions()
          .filter(q => q.questionType === 'PRONUNCIATION')
          .forEach(q => this.fetchPronTts(q));

        if (this.refType === 'PLACEMENT') {
          const levelName = rs.assignedLevelName || 'A1';
          this.placementLevel = levelName;
          setTimeout(() => {
            const proceed = window.confirm(
              `🎉 Great Job!\n\nYour English proficiency has been assessed as: ${levelName}\n\nWe recommend starting from this level.\n\nClick OK to Start Learning.`
            );
            if (proceed) {
              this.startLearning();
            }
          }, 200);
        }
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

          this.showResultSummary = true;
        });
    });
  }
  retryQuiz() {
    localStorage.removeItem(`quiz_end_time_${this.quiz?.quizId}`);
    this.selectedAnswers = {};
    for (const state of Object.values(this.pronunciationStates)) {
      if (state.recordedAudioUrl) URL.revokeObjectURL(state.recordedAudioUrl);
    }
    this.pronunciationStates = {};
    this.writingAnswers = {};
    this.writingStates = {};
    this.activePart = 0;
    this.activeQuestion = 0;
    this.showResultSummary = false;
    this.flaggedQuestions = new Set<number>();

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

  getMediaUrl(
    fileName: string | undefined | null,
    folder: 'audios' | 'images',
  ): string | null {
    if (!fileName) {
      return null;
    }

    const baseUrl = environment.apiBaseUrl.replace(/\/api$/, '');
    const normalized = fileName.replace(/\\/g, '/').replace(/^\/*/, '');

    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return normalized;
    }

    if (
      normalized.startsWith(`${folder}/`) ||
      normalized.startsWith(`/${folder}/`)
    ) {
      return `${baseUrl}/${normalized.replace(/^\/*/, '')}`;
    }

    if (normalized.startsWith('audios/') || normalized.startsWith('images/')) {
      return `${baseUrl}/${normalized}`;
    }

    return `${baseUrl}/${folder}/${normalized}`;
  }

  getAudioUrl(fileName: string | undefined | null): string | null {
    return this.getMediaUrl(fileName, 'audios');
  }

  getImageUrl(fileName: string | undefined | null): string | null {
    return this.getMediaUrl(fileName, 'images');
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

  isCorrectAnswer(_q: any, a: any): boolean {
    return a.isCorrect;
  }

  isSelected(q: any, a: any): boolean {
    return this.selectedAnswers[q.questionId] === a.answerId;
  }

  isWrong(q: any, a: any): boolean {
    return this.showResult && this.isSelected(q, a) && !a.isCorrect;
  }

  goBackCourse() {
    this.router.navigate(['/user/units']);
  }

  startLearning() {
    if (!this.quiz || this.isStartingLearning) return;
    this.isStartingLearning = true;
    this.testService.startLearning(this.quiz.quizId).subscribe({
      next: () => this.router.navigate(['/user/units']),
      error: () => {
        this.isStartingLearning = false;
        alert('Something went wrong. Please try again.');
      }
    });
  }
  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    for (const state of Object.values(this.pronunciationStates)) {
      if (state.mediaRecorder?.state !== 'inactive') {
        state.mediaRecorder?.stop();
      }
      if (state.recordedAudioUrl) URL.revokeObjectURL(state.recordedAudioUrl);
    }
  }
  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(_$event: any) {
    if (!this.isSubmitted && this.quiz && !this.hasSubmitted) {
      this.hasSubmitted = true;

      navigator.sendBeacon(
        `${environment.apiBaseUrl}/tests/submitQuiz`,
        new Blob(
          [
            JSON.stringify({
              quizId: this.quiz.quizId,
              answerIds: Object.values(this.selectedAnswers),
              specialAnswers: this.buildSpecialAnswers(),
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
