import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonFooter, IonHeader, NavController } from '@ionic/angular/standalone';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { TestService } from '@web/services/test.service';
import { LearningService } from '@web/services/learning.service';
import { AsrService, WordResult } from '@web/services/asr.service';
import { TtsService } from '@web/services/tts.service';
import { QuizDTO } from '@web/models/quiz.model';
import { SpecialAnswerDTO, SubmitQuizDTO } from '@web/models/submit-quiz.model';
import { environment } from '../../../environments/environment';
import { FeedbackService } from '../../core/feedback.service';
import { IconComponent } from '../../ui/icon.component';
import { LoadingComponent } from '../../ui/states.component';

interface PronState {
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

/** Một câu hỏi trong danh sách phẳng (kèm phần / đoạn văn chứa nó). */
interface FlatQ {
  q: any;
  no: number; // số thứ tự toàn bài (Câu N)
  partIndex: number; // -1 nếu quiz không chia phần
  passage: any | null;
}

const PASS_MARK = 80; // điểm chấm phát âm / viết được coi là đúng (giống web)

/**
 * 07 Quiz + 08 Quiz Results + chế độ Review — design-mobile/screens/Quiz.dc.html, QuizResults.dc.html.
 * Logic theo Fontend/.../ViewUser/Learning/quiz/quiz.component.ts. Trên mobile hiển thị từng câu một,
 * tab "Phần N" nhảy tới câu đầu của phần, lưới số câu là các câu của phần đang xem.
 */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonFooter, FormsModule, DecimalPipe, IconComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quiz.page.html',
  styleUrls: ['./quiz.page.css'],
  host: { class: 'bg-quiz' },
})
export class QuizPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private nav = inject(NavController);
  private tests = inject(TestService);
  private learning = inject(LearningService);
  private asr = inject(AsrService);
  private tts = inject(TtsService);
  private fb = inject(FeedbackService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild(IonContent) content?: IonContent;

  readonly icons = {
    close: 'M18 6 6 18M6 6l12 12',
    flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
  };

  refType = 'UNIT';
  refId = 0;
  unitId = 0;
  unitNo = 0;
  unitName = '';

  loading = true;
  quiz: QuizDTO | null = null;
  flat: FlatQ[] = [];
  current = 0;

  selectedAnswers: Record<number, number> = {};
  writingAnswers: Record<number, string> = {};
  pron: Record<number, PronState> = {};
  writing: Record<number, WritingState> = {};
  flagged = new Set<number>();

  // kết quả
  isSubmitted = false;
  submitting = false;
  showSummary = false; // true = màn "Your Results"; false + isSubmitted = review
  isPassed = false;
  currentScore = 0;
  correctCount = 0;
  wrongCount = 0;
  skippedCount = 0;
  earnedPoints = 0;
  totalPoints = 0;
  placementLevel = '';
  hasPrevious = false;

  // timer
  timeLeft = 0;
  timerText = '';
  private timer: any = null;

  ngOnInit(): void {
    const p = this.route.snapshot.queryParamMap;
    this.unitId = Number(p.get('unitId')) || 0;
    this.refType = p.get('refType') || 'UNIT';
    this.refId = Number(p.get('refId')) || 0;
    this.unitNo = Number(p.get('n')) || 0;
    if (this.refType === 'UNIT' && !this.refId) this.refId = this.unitId;
    this.load();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    for (const s of Object.values(this.pron)) {
      if (s.mediaRecorder && s.mediaRecorder.state !== 'inactive') s.mediaRecorder.stop();
      if (s.recordedAudioUrl) URL.revokeObjectURL(s.recordedAudioUrl);
    }
  }

  // ───────────── Tải đề ─────────────
  private async load(): Promise<void> {
    try {
      if (this.refType === 'UNIT' && this.unitId) {
        const unit = await firstValueFrom(this.learning.getUnitById(this.unitId));
        this.unitName = unit?.unitName ?? '';
      }
      this.quiz = await firstValueFrom(this.tests.getQuiz(this.refId, this.refType));
      if (!this.quiz) throw new Error('empty');
      this.flat = this.buildFlat(this.quiz);
      this.totalPoints = this.flat.reduce((s, f) => s + (Number(f.q.score) || 0), 0);
      const prev = await firstValueFrom(this.tests.getMyQuizResult(this.quiz.quizId).pipe(catchError(() => of(null))));
      this.hasPrevious = !!prev;
      this.startTimer();
    } catch {
      this.fb.toast('Quiz not found', 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
  }

  private buildFlat(quiz: QuizDTO): FlatQ[] {
    const out: FlatQ[] = [];
    const seen = new Set<number>();
    const push = (q: any, partIndex: number, passage: any) => {
      if (seen.has(q.questionId)) return;
      seen.add(q.questionId);
      out.push({ q, no: out.length + 1, partIndex, passage });
    };
    if (quiz.parts?.length) {
      quiz.parts.forEach((part: any, pi: number) => {
        (part.questions ?? []).forEach((q: any) => push(q, pi, null));
        (part.passages ?? []).forEach((psg: any) => (psg.questions ?? []).forEach((q: any) => push(q, pi, psg)));
      });
    } else {
      (quiz.questions ?? []).forEach((q: any) => push(q, -1, null));
    }
    return out;
  }

  get hasParts(): boolean {
    return !!this.quiz?.parts?.length;
  }

  get cur(): FlatQ | null {
    return this.flat[this.current] ?? null;
  }

  get typeLabel(): string {
    return (
      { UNIT: 'Unit Test', COURSE_JUMP: 'Skip Course Test', LEVEL_JUMP: 'Skip Level Test', PLACEMENT: 'Placement Test' } as Record<string, string>
    )[this.refType] ?? 'Test';
  }

  get passScore(): number {
    return this.quiz?.passScore || 70;
  }

  get resultTitle(): string {
    if (this.refType === 'UNIT' && this.unitName) return this.unitNo ? `Unit ${this.unitNo} · ${this.unitName}` : this.unitName;
    return this.quiz?.quizName ?? '';
  }

  /** Câu thuộc phần đang xem (dùng cho lưới số câu). */
  get gridItems(): FlatQ[] {
    if (!this.hasParts) return this.flat;
    const pi = this.cur?.partIndex ?? 0;
    return this.flat.filter((f) => f.partIndex === pi);
  }

  get gridTitle(): string {
    if (!this.hasParts || !this.quiz) return 'Questions';
    const part: any = this.quiz.parts[this.cur?.partIndex ?? 0];
    return `Phần ${part?.partNumber ?? (this.cur?.partIndex ?? 0) + 1} · Questions`;
  }

  partAnswered(pi: number): number {
    return this.flat.filter((f) => f.partIndex === pi && this.isAnswered(f.q)).length;
  }

  partTotal(pi: number): number {
    return this.flat.filter((f) => f.partIndex === pi).length;
  }

  isPartStart(f: FlatQ): boolean {
    const i = this.flat.indexOf(f);
    return i === 0 || this.flat[i - 1].partIndex !== f.partIndex;
  }

  // ───────────── Điều hướng ─────────────
  go(index: number): void {
    if (index < 0 || index >= this.flat.length) return;
    this.current = index;
    this.content?.scrollToTop(200);
    this.cdr.markForCheck();
  }

  goPart(pi: number): void {
    const i = this.flat.findIndex((f) => f.partIndex === pi);
    if (i >= 0) this.go(i);
  }

  goQ(f: FlatQ): void {
    this.go(this.flat.indexOf(f));
  }

  toggleFlag(qId: number): void {
    this.flagged.has(qId) ? this.flagged.delete(qId) : this.flagged.add(qId);
  }

  // ───────────── Trả lời ─────────────
  select(qId: number, aId: number): void {
    if (this.isSubmitted) return;
    this.selectedAnswers = { ...this.selectedAnswers, [qId]: aId };
  }

  isAnswered(q: any): boolean {
    if (q.questionType === 'PRONUNCIATION') return this.pron[q.questionId]?.score !== undefined;
    if (q.questionType === 'WRITING') return !!(this.writingAnswers[q.questionId] || '').trim();
    return this.selectedAnswers[q.questionId] !== undefined;
  }

  isMC(q: any): boolean {
    return !q.questionType || q.questionType === 'MULTIPLE_CHOICE';
  }

  answerClass(q: any, a: any): string {
    const selected = this.selectedAnswers[q.questionId] === a.answerId;
    if (this.isSubmitted) {
      if (a.isCorrect) return 'opt opt--correct';
      if (selected) return 'opt opt--wrong';
      return 'opt';
    }
    return selected ? 'opt opt--on' : 'opt';
  }

  letter(i: number): string {
    return String.fromCharCode(65 + i);
  }

  correctText(q: any): string {
    return q.answers?.find((a: any) => a.isCorrect)?.answerText || '';
  }

  pronState(qId: number): PronState {
    return (this.pron[qId] ??= { isRecording: false, isTranscribing: false, wordResults: [], audioChunks: [] });
  }

  writingState(qId: number): WritingState {
    return (this.writing[qId] ??= { isChecking: false, wordResults: [] });
  }

  // ───────────── Ghi âm phát âm (giống web) ─────────────
  toggleRecord(q: any): void {
    const s = this.pronState(q.questionId);
    s.isRecording ? this.stopRecord(q) : this.startRecord(q);
  }

  private startRecord(q: any): void {
    const s = this.pronState(q.questionId);
    s.audioChunks = [];
    s.score = undefined;
    s.wordResults = [];
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', ''].find((t) => !t || MediaRecorder.isTypeSupported(t)) ?? '';

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
        s.mediaRecorder = recorder;
        recorder.addEventListener('dataavailable', (e: BlobEvent) => {
          if (e.data?.size > 0) s.audioChunks.push(e.data);
        });
        recorder.addEventListener('stop', () => {
          stream.getTracks().forEach((t) => t.stop());
          this.zone.run(async () => {
            if (!s.audioChunks.length) return;
            const blob = new Blob(s.audioChunks, { type: recorder.mimeType || 'audio/webm' });
            try {
              const wav = await toWav16k(blob);
              if (s.recordedAudioUrl) URL.revokeObjectURL(s.recordedAudioUrl);
              s.recordedAudioUrl = URL.createObjectURL(wav);
              s.isTranscribing = true;
              this.cdr.markForCheck();
              this.asr.grade(wav, q.questionText || '', 'wav').subscribe({
                next: (res) => {
                  s.score = res.score;
                  s.wordResults = res.words ?? [];
                  s.isTranscribing = false;
                  this.cdr.markForCheck();
                },
                error: () => {
                  s.isTranscribing = false;
                  this.fb.toast('Could not grade your recording. Please try again.', 'error');
                  this.cdr.markForCheck();
                },
              });
            } catch {
              s.isTranscribing = false;
              this.cdr.markForCheck();
            }
          });
        });
        recorder.start(100);
        this.zone.run(() => {
          s.isRecording = true;
          this.cdr.markForCheck();
        });
      })
      .catch(() => this.fb.toast('Cannot access microphone. Please allow microphone permission.', 'error'));
  }

  private stopRecord(q: any): void {
    const s = this.pron[q.questionId];
    if (!s) return;
    if (s.mediaRecorder && s.mediaRecorder.state !== 'inactive') {
      s.mediaRecorder.requestData();
      s.mediaRecorder.stop();
    }
    s.isRecording = false;
  }

  // ───────────── Nộp bài ─────────────
  async confirmSubmit(): Promise<void> {
    const unanswered = this.flat.filter((f) => !this.isAnswered(f.q)).length;
    const ok = await this.fb.confirm({
      header: 'Submit your test?',
      message: unanswered ? `You have ${unanswered} unanswered question(s).` : 'You can review your answers after submitting.',
      okText: 'Submit',
    });
    if (ok) this.submit();
  }

  /** Câu viết chưa chấm thì chấm trước rồi mới nộp (giống web). */
  submit(): void {
    if (!this.quiz || this.submitting || this.isSubmitted) return;
    this.submitting = true;
    this.cdr.markForCheck();
    const unchecked = this.flat
      .map((f) => f.q)
      .filter((q) => q.questionType === 'WRITING' && (this.writingAnswers[q.questionId] || '').trim() && this.writing[q.questionId]?.score === undefined);
    if (!unchecked.length) {
      this.doSubmit();
      return;
    }
    forkJoin(
      unchecked.map((q) =>
        this.asr.compareText(this.writingAnswers[q.questionId].trim(), this.correctText(q)).pipe(
          tap((res) => {
            const st = this.writingState(q.questionId);
            st.score = res.score;
            st.wordResults = res.words ?? [];
          }),
          catchError(() => of(null)),
        ),
      ),
    ).subscribe(() => this.doSubmit());
  }

  private doSubmit(): void {
    if (!this.quiz) return;
    const dto: SubmitQuizDTO = {
      quizId: this.quiz.quizId,
      answerIds: Object.values(this.selectedAnswers),
      specialAnswers: this.buildSpecial(),
    };
    clearInterval(this.timer);
    localStorage.removeItem(this.timerKey);
    this.tests.submitQuiz(dto).subscribe({
      next: () => this.loadResult(),
      error: () => {
        this.submitting = false;
        this.fb.toast('Submit failed. Please try again.', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  private buildSpecial(): SpecialAnswerDTO[] {
    const out: SpecialAnswerDTO[] = [];
    for (const [qId, s] of Object.entries(this.pron)) if (s.score !== undefined) out.push({ questionId: +qId, speakScore: s.score });
    for (const [qId, s] of Object.entries(this.writing)) if (s.score !== undefined) out.push({ questionId: +qId, speakScore: s.score });
    return out;
  }

  private loadResult(): void {
    if (!this.quiz) return;
    this.tests.getMyQuizResult(this.quiz.quizId).subscribe({
      next: (rs) => {
        this.submitting = false;
        if (!rs) return;
        this.currentScore = rs.score;
        this.countResults();
        this.isPassed = this.refType === 'PLACEMENT' ? true : rs.isPassed;
        this.isSubmitted = true;
        this.showSummary = true;
        this.hasPrevious = true;
        this.flat.filter((f) => f.q.questionType === 'PRONUNCIATION').forEach((f) => this.fetchReferenceAudio(f.q));
        this.content?.scrollToTop(0);
        this.cdr.markForCheck();
        if (this.refType === 'PLACEMENT') {
          this.placementLevel = rs.assignedLevelName || 'A1';
          setTimeout(() => this.askStartLearning(), 300);
        }
      },
      error: () => {
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  private countResults(): void {
    this.correctCount = this.wrongCount = this.skippedCount = this.earnedPoints = 0;
    for (const { q } of this.flat) {
      let verdict: 'ok' | 'bad' | 'skip';
      if (q.questionType === 'PRONUNCIATION' || q.questionType === 'WRITING') {
        const s = q.questionType === 'PRONUNCIATION' ? this.pron[q.questionId] : this.writing[q.questionId];
        verdict = s?.score === undefined ? 'skip' : s.score >= PASS_MARK ? 'ok' : 'bad';
      } else {
        const sel = this.selectedAnswers[q.questionId];
        verdict = sel === undefined ? 'skip' : q.answers?.find((a: any) => a.isCorrect)?.answerId === sel ? 'ok' : 'bad';
      }
      if (verdict === 'ok') {
        this.correctCount++;
        this.earnedPoints += Number(q.score) || 0;
      } else if (verdict === 'bad') this.wrongCount++;
      else this.skippedCount++;
    }
  }

  private fetchReferenceAudio(q: any): void {
    const s = this.pronState(q.questionId);
    if (s.ttsAudioUrl || !q.questionText) return;
    this.tts.synthesize(q.questionText).subscribe({
      next: (res) => {
        s.ttsAudioUrl = `${environment.serverUrl}${res.audioUrl}`;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  private async askStartLearning(): Promise<void> {
    const ok = await this.fb.confirm({
      header: '🎉 Great Job!',
      message: `Your Vietnamese level has been assessed as: ${this.placementLevel}. We recommend starting from this level.`,
      okText: 'Start Learning',
      cancelText: 'Later',
    });
    if (ok) this.startLearning();
  }

  startLearning(): void {
    if (!this.quiz) return;
    this.tests.startLearning(this.quiz.quizId).subscribe({
      next: () => this.nav.navigateRoot('/learn'),
      error: () => this.fb.toast('Something went wrong. Please try again.', 'error'),
    });
  }

  // ───────────── Sau khi nộp ─────────────
  review(): void {
    this.showSummary = false;
    this.go(0);
  }

  backToSummary(): void {
    this.showSummary = true;
    this.content?.scrollToTop(0);
  }

  /** Xem lại lần làm trước (chỉ khôi phục được đáp án trắc nghiệm — giống web). */
  reviewPrevious(): void {
    if (!this.quiz) return;
    clearInterval(this.timer);
    const quizId = this.quiz.quizId;
    forkJoin([this.tests.getMyQuizResult(quizId), this.tests.getUserAnswersRaw(quizId)]).subscribe({
      next: ([rs, answers]) => {
        const owner: Record<number, number> = {};
        this.flat.forEach((f) => (f.q.answers ?? []).forEach((a: any) => (owner[a.answerId] = f.q.questionId)));
        const sel: Record<number, number> = {};
        (answers ?? []).forEach((ua: any) => {
          const qId = owner[ua.answerId];
          if (qId) sel[qId] = ua.answerId;
        });
        this.selectedAnswers = sel;
        this.currentScore = rs?.score ?? 0;
        this.isPassed = this.refType === 'PLACEMENT' ? true : !!rs?.isPassed;
        this.countResults();
        this.isSubmitted = true;
        this.showSummary = true;
        this.cdr.markForCheck();
      },
      error: () => this.fb.toast('Could not load your previous attempt.', 'error'),
    });
  }

  retry(): void {
    localStorage.removeItem(this.timerKey);
    for (const s of Object.values(this.pron)) if (s.recordedAudioUrl) URL.revokeObjectURL(s.recordedAudioUrl);
    this.selectedAnswers = {};
    this.writingAnswers = {};
    this.pron = {};
    this.writing = {};
    this.flagged = new Set();
    this.isSubmitted = false;
    this.showSummary = false;
    this.isPassed = false;
    this.currentScore = 0;
    this.go(0);
    this.startTimer();
  }

  continue(): void {
    this.nav.navigateRoot('/learn');
  }

  backToList(): void {
    this.nav.navigateRoot(this.refType === 'PLACEMENT' ? '/learn/tests' : '/learn');
  }

  /** Nút X: đang làm bài thì xác nhận rồi nộp luôn (web tự nộp khi rời trang). */
  async exit(): Promise<void> {
    if (this.isSubmitted || !this.quiz || this.loading) {
      this.backToList();
      return;
    }
    const ok = await this.fb.confirm({
      header: 'Leave the test?',
      message: 'Your current answers will be submitted.',
      okText: 'Submit & leave',
      danger: true,
    });
    if (!ok) return;
    const dto: SubmitQuizDTO = { quizId: this.quiz.quizId, answerIds: Object.values(this.selectedAnswers), specialAnswers: this.buildSpecial() };
    clearInterval(this.timer);
    localStorage.removeItem(this.timerKey);
    this.tests.submitQuiz(dto).pipe(catchError(() => of(null))).subscribe(() => this.backToList());
  }

  // ───────────── Timer (lưu giờ kết thúc để reload không mất) ─────────────
  private get timerKey(): string {
    return `quiz_end_time_${this.quiz?.quizId}`;
  }

  private startTimer(): void {
    clearInterval(this.timer);
    if (!this.quiz?.timeLimit) {
      this.timerText = '';
      return;
    }
    let end = Number(localStorage.getItem(this.timerKey));
    if (!end || end <= Date.now()) {
      end = Date.now() + this.quiz.timeLimit * 60_000;
      localStorage.setItem(this.timerKey, String(end));
    }
    const tick = () => {
      if (this.isSubmitted) {
        clearInterval(this.timer);
        return;
      }
      this.timeLeft = Math.max(0, Math.floor((end - Date.now()) / 1000));
      this.timerText = `${String(Math.floor(this.timeLeft / 60)).padStart(2, '0')}:${String(this.timeLeft % 60).padStart(2, '0')}`;
      this.cdr.markForCheck();
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.fb.toast("Time's up! Your test has been submitted.");
        this.submit();
      }
    };
    tick();
    this.timer = setInterval(tick, 1000);
  }

  // ───────────── Media ─────────────
  mediaSrc(file: string | null | undefined, folder: 'audios' | 'images'): string {
    if (!file) return '';
    const f = file.replace(/\\/g, '/').replace(/^\/*/, '');
    if (/^https?:/.test(f)) return f;
    if (f.startsWith('audios/') || f.startsWith('images/')) return `${environment.serverUrl}/${f}`;
    return `${environment.serverUrl}/${folder}/${f}`;
  }
}

/** Chuyển bản ghi (webm/mp4) sang WAV mono 16 kHz cho ASR — giống convertToWav của web. */
async function toWav16k(blob: Blob): Promise<Blob> {
  const buf = await blob.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: 16000 });
  const audio = await ctx.decodeAudioData(buf);
  await ctx.close();
  const n = audio.length;
  const pcm = audio.getChannelData(0);
  const out = new ArrayBuffer(44 + n * 2);
  const v = new DataView(out);
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  w(0, 'RIFF');
  v.setUint32(4, 36 + n * 2, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 16000, true);
  v.setUint32(28, 32000, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, 'data');
  v.setUint32(40, n * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++, o += 2) {
    const x = Math.max(-1, Math.min(1, pcm[i]));
    v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  return new Blob([out], { type: 'audio/wav' });
}
