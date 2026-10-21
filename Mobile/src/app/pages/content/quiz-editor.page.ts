import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonFooter, IonHeader, IonModal } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { TestService } from '@web/services/test.service';
import { LearningService } from '@web/services/learning.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';

type QType = 'MULTIPLE_CHOICE' | 'PRONUNCIATION' | 'WRITING';
type MediaKind = 'image' | 'audio';

const REF_LABELS: Record<string, string> = {
  UNIT: 'Unit Test',
  COURSE_JUMP: 'Skip Course Test',
  LEVEL_JUMP: 'Skip Level Test',
  PLACEMENT: 'Placement Test',
};

/**
 * Quiz editor (chưa có design — dựng theo ui-spec §3 "Quiz editor") — /admin/quiz?refType=&refId=
 * Logic theo web Learning/quiz/test.component: mỗi câu / part / passage là card thu gọn được.
 */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonFooter, IonModal, FormsModule, NgTemplateOutlet, NavBarComponent, IconComponent, LoadingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quiz-editor.page.html',
  styleUrls: ['./content.css', './quiz-editor.page.css'],
  host: { class: 'bg-admin' },
})
export class QuizEditorPage implements OnInit, OnDestroy {
  private tests = inject(TestService);
  private learning = inject(LearningService);
  private fb = inject(FeedbackService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild(IonContent) content?: IonContent;

  readonly icons = {
    ...ICONS,
    image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
    music: 'M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    stop: 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    x: 'M18 6 6 18M6 6l12 12',
    trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    chevronDown: 'm6 9 6 6 6-6',
    plus: 'M12 5v14M5 12h14',
  };

  readonly types: { value: QType; label: string }[] = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
    { value: 'PRONUNCIATION', label: 'Pronunciation' },
    { value: 'WRITING', label: 'Writing' },
  ];

  refId = 0;
  refType = '';
  loading = false;
  saving = false;
  showPreview = false;

  quiz: any = null;
  /** Bật/tắt timer (tách khỏi timeLimit để ô số phút không biến mất khi đang xóa chữ). */
  timerOn = false;

  // Trạng thái giao diện — không gửi lên API
  private openSet = new WeakSet<object>();
  private uids = new WeakMap<object, number>();
  private blobs = new WeakMap<object, string>();
  private uploading = new WeakSet<object>();
  private uidSeq = 0;

  // Ghi âm
  private recordingTarget: object | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  get refLabel(): string {
    return REF_LABELS[this.refType] ?? 'Quiz';
  }

  get backHref(): string {
    switch (this.refType) {
      case 'UNIT':
        return `/admin/units/${this.refId}`;
      case 'COURSE_JUMP':
        return `/admin/content?seg=units&courseId=${this.refId}`;
      case 'LEVEL_JUMP':
        return `/admin/content?seg=courses&levelId=${this.refId}`;
      case 'PLACEMENT':
        return '/admin/placements';
      default:
        return '/admin/content';
    }
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.refId = Number(q.get('refId') || 0);
    this.refType = (q.get('refType') || '').toUpperCase();
    if (this.refId > 0 && this.refType) this.loadQuiz();
  }

  ngOnDestroy(): void {
    this.stopRecording();
    this.stream?.getTracks().forEach((t) => t.stop());
  }

  // ---------- Tải ----------

  async loadQuiz(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.tests.getQuiz(this.refId, this.refType));
      if (res && res.quizId) {
        this.quiz = res;
        this.quiz.questions ??= [];
        this.quiz.parts ??= [];
        this.quiz.quizMode = null;
        if (this.quiz.parts.length > 0) this.quiz.quizMode = 'part';
        else if (this.quiz.questions.length > 0) this.quiz.quizMode = 'question';

        this.quiz.questions.forEach((q: any) => this.initQuestion(q));
        this.quiz.parts.forEach((part: any) => {
          part.questions ??= [];
          part.passages ??= [];
          part.mode = part.questions.length > 0 ? 'question' : part.passages.length > 0 ? 'passage' : null;
          part.questions.forEach((q: any) => this.initQuestion(q));
          part.passages.forEach((psg: any) => {
            psg.questions ??= [];
            psg.questions.forEach((q: any) => this.initQuestion(q));
          });
          this.openSet.add(part);
        });
        this.timerOn = this.quiz.timeLimit != null;
      } else {
        this.quiz = null;
      }
    } catch (err) {
      this.quiz = null;
      this.fb.toast(errorMessage(err, 'Failed to load quiz'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
  }

  private initQuestion(q: any): void {
    q.answers ??= [];
    q.isDelete ??= false;
    if (q.questionType === 'WRITING' && q.answers.filter((a: any) => !a.isDelete).length === 0) {
      q.answers = [this.createAnswer(0)];
      q.answers[0].isCorrect = true;
    }
  }

  // ---------- Tạo / thêm ----------

  addQuiz(): void {
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
    this.timerOn = false;
  }

  private createQuestion(partId: number | null, passageId: number | null): any {
    const q = {
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
      questionType: 'MULTIPLE_CHOICE',
      answers: [this.createAnswer(0), this.createAnswer(1)],
    };
    this.openSet.add(q);
    return q;
  }

  private createAnswer(index: number): any {
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

  addQuestionToQuiz(): void {
    this.quiz.quizMode = 'question';
    this.quiz.questions.push(this.createQuestion(null, null));
  }

  addQuestionToPart(part: any): void {
    part.mode = 'question';
    part.questions.push(this.createQuestion(part.partId, null));
  }

  addQuestionToPassage(psg: any, part: any): void {
    psg.questions.push(this.createQuestion(part.partId, psg.passageId));
  }

  addPart(): void {
    this.quiz.quizMode = 'part';
    const n = this.quiz.parts.length + 1;
    const part = {
      partId: 0,
      quizId: this.quiz.quizId,
      partNumber: n,
      partName: 'Part ' + n,
      instruction: '',
      isDelete: false,
      mode: null,
      questions: [],
      passages: [],
    };
    this.openSet.add(part);
    this.quiz.parts.push(part);
  }

  addPassage(part: any): void {
    part.mode = 'passage';
    const psg = {
      passageId: 0,
      partId: part.partId,
      content: '',
      imageUrl: null,
      audioUrl: null,
      orderIndex: part.passages.length + 1,
      isDelete: false,
      questions: [],
    };
    this.openSet.add(psg);
    part.passages.push(psg);
  }

  addAnswer(q: any): void {
    const next = q.answers.filter((a: any) => !a.isDelete).length;
    q.answers.push({
      answerId: 0,
      questionId: q.questionId,
      answerText: '',
      isCorrect: false,
      imageUrl: null,
      audioUrl: null,
      answerLabel: String.fromCharCode(65 + next),
      orderIndex: next + 1,
      isDelete: false,
    });
  }

  // ---------- Xóa ----------

  deleteQuestion(q: any, list: any[]): void {
    if (q.questionId > 0) q.isDelete = true;
    else {
      const i = list.indexOf(q);
      if (i >= 0) list.splice(i, 1);
    }
  }

  deleteAnswer(q: any, a: any): void {
    if (a.answerId > 0) a.isDelete = true;
    else {
      const i = q.answers.indexOf(a);
      if (i >= 0) q.answers.splice(i, 1);
    }
    q.answers.filter((x: any) => !x.isDelete).forEach((x: any, i: number) => (x.answerLabel = String.fromCharCode(65 + i)));
  }

  async deletePart(part: any): Promise<void> {
    const ok = await this.fb.confirm({
      header: 'Delete part?',
      message: 'This part and its questions will be removed when you save the quiz.',
      okText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    if (part.partId > 0) part.isDelete = true;
    else {
      const i = this.quiz.parts.indexOf(part);
      if (i >= 0) this.quiz.parts.splice(i, 1);
    }
    this.cdr.markForCheck();
  }

  async deletePassage(psg: any, part: any): Promise<void> {
    const ok = await this.fb.confirm({
      header: 'Delete passage?',
      message: 'This passage and its questions will be removed when you save the quiz.',
      okText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    if (psg.passageId > 0) psg.isDelete = true;
    else {
      const i = part.passages.indexOf(psg);
      if (i >= 0) part.passages.splice(i, 1);
    }
    this.cdr.markForCheck();
  }

  // ---------- Câu hỏi ----------

  onQuestionTypeChange(q: any, type: QType): void {
    q.questionType = type;
    if (type === 'PRONUNCIATION') {
      q.answers = [];
    } else if (type === 'WRITING') {
      const existing = q.answers?.find((a: any) => a.isCorrect && !a.isDelete);
      q.answers = [existing ?? this.createAnswer(0)];
      q.answers[0].isCorrect = true;
    } else if (!q.answers?.filter((a: any) => !a.isDelete).length) {
      q.answers = [this.createAnswer(0), this.createAnswer(1)];
    }
  }

  selectCorrectAnswer(q: any, a: any): void {
    q.answers.forEach((x: any) => (x.isCorrect = false));
    a.isCorrect = true;
  }

  visible(list: any[] | null | undefined): any[] {
    return (list ?? []).filter((x) => !x.isDelete);
  }

  labelOf(q: any, a: any): string {
    return String.fromCharCode(65 + Math.max(0, this.visible(q.answers).indexOf(a)));
  }

  typeLabel(t: string | null | undefined): string {
    return this.types.find((x) => x.value === t)?.label ?? 'Multiple Choice';
  }

  summary(q: any): string {
    if (q.questionText?.trim()) return q.questionText.trim();
    if (q.imageUrl) return '[Image]';
    if (q.audioUrl || this.blobs.has(q)) return '[Audio]';
    return 'Empty question';
  }

  /** Số thứ tự câu trên toàn bài (giống getQuestionIndex của web). */
  questionNo(q: any): number {
    const all: any[] = [...this.visible(this.quiz?.questions)];
    for (const part of this.visible(this.quiz?.parts)) {
      all.push(...this.visible(part.questions));
      for (const psg of this.visible(part.passages)) all.push(...this.visible(psg.questions));
    }
    return all.indexOf(q) + 1;
  }

  get totalScore(): number {
    if (!this.quiz) return 0;
    let total = 0;
    const add = (list: any[] | undefined) => list?.forEach((q: any) => !q.isDelete && (total += Number(q.score) || 0));
    add(this.quiz.questions);
    this.quiz.parts?.forEach((part: any) => {
      add(part.questions);
      part.passages?.forEach((psg: any) => add(psg.questions));
    });
    return total;
  }

  get modeLabel(): string {
    const m = this.quiz?.quizMode;
    return m ? (m === 'question' ? 'Question-only' : 'Part-based') : 'Draft';
  }

  // ---------- Thu gọn ----------

  isOpen(o: object): boolean {
    return this.openSet.has(o);
  }

  toggle(o: object): void {
    if (this.openSet.has(o)) this.openSet.delete(o);
    else this.openSet.add(o);
  }

  uid(o: object): number {
    let id = this.uids.get(o);
    if (!id) {
      id = ++this.uidSeq;
      this.uids.set(o, id);
    }
    return id;
  }

  // ---------- Media ----------

  imageSrc(t: any): string {
    return mediaUrl(t.imageUrl, 'images');
  }

  hasAudio(t: any): boolean {
    return !!t.audioUrl || this.blobs.has(t);
  }

  audioSrc(t: any): string {
    return this.blobs.get(t) ?? mediaUrl(t.audioUrl, 'audios');
  }

  isUploading(t: object): boolean {
    return this.uploading.has(t);
  }

  removeImage(t: any): void {
    t.imageUrl = null;
  }

  removeAudio(t: any): void {
    t.audioUrl = null;
    const b = this.blobs.get(t);
    if (b) URL.revokeObjectURL(b);
    this.blobs.delete(t);
  }

  /** Chọn file ảnh / audio. clearText = true với passage (web xóa nội dung chữ khi gắn media). */
  onPick(event: Event, t: any, kind: MediaKind, clearText = false): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (kind === 'image') this.removeAudio(t);
    else t.imageUrl = null;
    if (clearText) t.content = '';
    this.upload(file, t);
  }

  private async upload(file: File, t: any): Promise<void> {
    const fd = new FormData();
    fd.append('file', file);
    this.uploading.add(t);
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.learning.uploadMedia(fd));
      const fileName = res?.fileName || res?.filename || res?.url || res?.data;
      if (!fileName) throw new Error('No fileName');
      const isAudio =
        file.type.startsWith('audio/') || file.type === 'video/webm' || /\.(mp3|wav|webm|ogg|m4a)$/i.test(file.name);
      if (file.type.startsWith('image/')) {
        t.imageUrl = fileName;
        this.removeAudio(t);
      } else if (isAudio) {
        t.audioUrl = fileName;
        t.imageUrl = null;
        // giữ blob (nếu là bản ghi âm) để nghe lại ngay
      }
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Media upload failed'), 'error');
    }
    this.uploading.delete(t);
    this.cdr.markForCheck();
  }

  isRecordingTarget(t: object): boolean {
    return this.recordingTarget === t;
  }

  get isRecording(): boolean {
    return !!this.recordingTarget;
  }

  toggleRecord(t: any): void {
    if (this.isRecordingTarget(t)) this.stopRecording();
    else this.startRecording(t);
  }

  private async startRecording(t: any): Promise<void> {
    if (this.isRecording) {
      this.fb.toast('Stop the current recording first');
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.fb.toast('Microphone access denied', 'error');
      return;
    }
    this.stream = stream;
    this.recordingTarget = t;
    this.audioChunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : '';
    const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    this.mediaRecorder = rec;
    rec.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };
    rec.onstop = () => {
      const actualMime = rec.mimeType || 'audio/webm';
      const ext = actualMime.includes('ogg') ? '.ogg' : actualMime.includes('mp4') ? '.m4a' : '.webm';
      const blob = new Blob(this.audioChunks, { type: actualMime });
      // Nghe thử ngay bằng blob trong lúc tải lên
      this.removeAudio(t);
      this.blobs.set(t, URL.createObjectURL(blob));
      t.imageUrl = null;
      stream.getTracks().forEach((tr) => tr.stop());
      this.stream = null;
      this.upload(new File([blob], `recording${ext}`, { type: actualMime }), t);
    };
    rec.start();
    this.cdr.markForCheck();
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop();
    this.mediaRecorder = null;
    this.recordingTarget = null;
    this.cdr.markForCheck();
  }

  // ---------- Lưu / xóa quiz ----------

  onTimerToggle(on: boolean): void {
    this.timerOn = on;
    this.quiz.timeLimit = on ? (this.quiz.timeLimit ?? 30) : null;
  }

  async saveQuiz(): Promise<void> {
    if (!this.quiz) return;
    if (this.isRecording) this.stopRecording();
    if (!this.timerOn) this.quiz.timeLimit = null;
    else if (this.quiz.timeLimit != null) this.quiz.timeLimit = Number(this.quiz.timeLimit) || null;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.tests.saveQuiz(this.quiz));
      this.fb.toast('Quiz saved successfully', 'success');
      this.content?.scrollToTop(300);
      await this.loadQuiz();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to save quiz'), 'error');
    }
    this.saving = false;
    this.cdr.markForCheck();
  }

  async deleteQuiz(): Promise<void> {
    if (!this.quiz?.quizId) return;
    const ok = await this.fb.confirm({ header: 'Delete this quiz?', okText: 'Delete', danger: true });
    if (!ok) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.tests.deleteQuiz(this.quiz.quizId));
      this.fb.toast('Quiz deleted', 'success');
      this.quiz = null;
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Delete failed'), 'error');
    }
    this.saving = false;
    this.cdr.markForCheck();
  }
}
