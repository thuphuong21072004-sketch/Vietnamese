
import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TestService } from '../../../../services/test.service';
import { BaseService } from '../../../../services/base.service';
import { LearningService } from '../../../../services/learning.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css'],
})
export class QuizComponent implements OnChanges {
  serverUrl = environment.serverUrl;

  @Input() refId!: number;

  @Input() refType!: string;

  loading = false;

  quiz: any = null;

  constructor(
    private testService: TestService,
    private learningService: LearningService,
    private baseService: BaseService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
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

        if (res && res.quizId) {
          this.quiz = res;

          this.quiz.questions ??= [];

          this.quiz.parts ??= [];

          this.quiz.quizMode = null;

          if (this.quiz.parts && this.quiz.parts.length > 0) {
            this.quiz.quizMode = 'part';
          } else if (this.quiz.questions && this.quiz.questions.length > 0) {
            this.quiz.quizMode = 'question';
          }

          this.quiz.questions.forEach((q: any) => { this.initQuestion(q); });
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
            part.questions.forEach((q: any) => { this.initQuestion(q); });
            part.passages.forEach((psg: any) => {
              psg.questions ??= [];
              psg.questions.forEach((q: any) => { this.initQuestion(q); });
            });
          });
        } else {
          this.quiz = null;
        }
      },

      error: (err) => {
        this.loading = false;
        this.quiz = null;
        this.baseService.handleError(err, 'Failed to load quiz');
      },
    });
  }

  private initQuestion(q: any) {
    q.answers ??= [];
    q.isDelete ??= false;
    if (q.questionType === 'WRITING' && q.answers.filter((a: any) => !a.isDelete).length === 0) {
      q.answers = [this.createAnswer(0)];
      q.answers[0].isCorrect = true;
    }
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
      questionType: 'MULTIPLE_CHOICE',
      answers: [this.createAnswer(0), this.createAnswer(1)],
    };
  }

  onQuestionTypeChange(question: any) {
    if (question.questionType === 'PRONUNCIATION') {
      question.answers = [];
    } else if (question.questionType === 'WRITING') {
      const existing = question.answers?.find((a: any) => a.isCorrect && !a.isDelete);
      question.answers = [existing ?? this.createAnswer(0)];
      question.answers[0].isCorrect = true;
    } else {
      if (!question.answers?.filter((a: any) => !a.isDelete).length) {
        question.answers = [this.createAnswer(0), this.createAnswer(1)];
      }
    }
  }

  deleteQuestion(question: any, list: any[]) {
    if (question.questionId > 0) {
      question.isDelete = true;
    } else {
      const index = list.indexOf(question);
      if (index >= 0) list.splice(index, 1);
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

  deleteAnswer(question: any, answer: any) {
    if (answer.answerId > 0) {
      answer.isDelete = true;
    } else {
      const index = question.answers.indexOf(answer);
      if (index >= 0) question.answers.splice(index, 1);
    }
    question.answers.filter((a: any) => !a.isDelete).forEach((a: any, i: number) => {
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
    if (part.partId > 0) {
      part.isDelete = true;
    } else {
      const index = this.quiz.parts.indexOf(part);
      if (index >= 0) this.quiz.parts.splice(index, 1);
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
    if (psg.passageId > 0) {
      psg.isDelete = true;
    } else {
      const index = part.passages.indexOf(psg);
      if (index >= 0) part.passages.splice(index, 1);
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
        console.log('Upload response:', res);

        const fileName = res.fileName || res.filename || res.url || res.data;

        if (!fileName) {
          console.error('No fileName');

          return;
        }

        const isAudio = file.type.startsWith('audio/') || file.type === 'video/webm'
          || /\.(mp3|wav|webm|ogg|m4a)$/i.test(file.name);
        if (file.type.startsWith('image/')) {
          target.imageUrl = fileName;
          target.audioUrl = null;
          target._blobUrl = null;
        } else if (isAudio) {
          target.audioUrl = fileName;
          target.imageUrl = null;
          // Keep _blobUrl alive for preview; cleared on × or after save+reload
        }

        console.log('AFTER UPDATE', target);
      },

      error: (err) => {
        console.error(err);

        this.baseService.handleError(err, 'Media upload failed');
      },
    });
  }

  getAudioSrc(target: any): SafeUrl | string {
    if (target._blobUrl) return this.sanitizer.bypassSecurityTrustUrl(target._blobUrl);
    return environment.serverUrl + '/audios/' + target.audioUrl;
  }

  saveQuiz() {
    this.testService.saveQuiz(this.quiz).subscribe({
      next: () => {
        alert('Quiz saved successfully');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  showPreview = false;

  previewQuiz() {
    this.showPreview = true;
  }

  recordingTarget: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  isRecording = false;

  isRecordingTarget(target: any): boolean {
    return this.isRecording && this.recordingTarget === target;
  }

  startRecording(target: any): void {
    if (this.isRecording) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.recordingTarget = target;
      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') ? 'audio/ogg;codecs=opus'
        : '';
      this.mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        const actualMime = this.mediaRecorder?.mimeType || 'audio/webm';
        const ext = actualMime.includes('ogg') ? '.ogg' : '.webm';
        const blob = new Blob(this.audioChunks, { type: actualMime });
        // Show preview immediately via blob URL before upload completes
        if (target._blobUrl) URL.revokeObjectURL(target._blobUrl);
        target._blobUrl = URL.createObjectURL(blob);
        target.audioUrl = '__preview__';
        target.imageUrl = null;
        this.cdr.detectChanges();
        const file = new File([blob], `recording${ext}`, { type: actualMime });
        const dt = new DataTransfer();
        dt.items.add(file);
        this.handleMediaUpload({ target: { files: dt.files } } as any, target);
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      };
      this.mediaRecorder.start();
      this.isRecording = true;
    }).catch(() => alert('Microphone access denied'));
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.recordingTarget = null;
    }
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
