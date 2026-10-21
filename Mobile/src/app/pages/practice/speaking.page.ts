import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TtsService } from '@web/services/tts.service';
import { AsrService, PronunciationGradeResponse, WordResult } from '@web/services/asr.service';
import { FeedbackService } from '../../core/feedback.service';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { IconComponent } from '../../ui/icon.component';

/** Màu word-diff (README §2.1): nền / chữ theo trạng thái từ. */
const WORD_COLORS: Record<string, [string, string]> = {
  correct: ['#dcfce7', '#166534'],
  accent: ['#ffedd5', '#c2410c'],
  character: ['#fef9c3', '#854d0e'],
  wrong: ['#fee2e2', '#b91c1c'],
  missing: ['#f3f4f6', '#6b7280'],
  extra: ['#f3e8ff', '#7e22ce'],
};

/** 09 Speaking — design-mobile/screens/Speaking.dc.html */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, FormsModule, DecimalPipe, NavBarComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './speaking.page.html',
  styleUrls: ['./speaking.page.css'],
})
export class SpeakingPage implements OnDestroy {
  private http = inject(HttpClient);
  private tts = inject(TtsService);
  private asr = inject(AsrService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = {
    speaker: 'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
    close: 'M18 6 6 18M6 6l12 12',
    swap: 'M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4',
    mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3',
    stop: 'M6 6h12v12H6z',
  };
  readonly legend = [
    { t: 'Correct', c: '#22c55e' },
    { t: 'Tone/accent', c: '#f97316' },
    { t: 'Similar', c: '#eab308' },
    { t: 'Wrong', c: '#ef4444' },
    { t: 'Missing', c: '#9ca3af' },
    { t: 'Extra', c: '#a855f7' },
  ];

  englishText = '';
  vietnameseText = '';
  isLoading = false;
  isSpeakingVi = false;
  translateError = '';

  isRecording = false;
  isTranscribing = false;
  transcribedText = '';
  recordedBlobUrl = '';
  gradeResult: PronunciationGradeResponse | null = null;
  wordResults: WordResult[] = [];

  /** Ô vừa gõ gần nhất — nút ⇄ dịch lại từ ô này. */
  private lastSide: 'en' | 'vi' = 'en';
  private ttsAudioUrl: string | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingMime = 'audio/webm';
  private enInput$ = new Subject<string>();
  private viInput$ = new Subject<string>();
  private subs: Subscription[] = [];

  constructor() {
    // Tự dịch khi gõ (debounce 600ms như web)
    this.subs.push(
      this.enInput$.pipe(debounceTime(600), distinctUntilChanged()).subscribe((t) => this.doTranslate(t, 'en', 'vi')),
      this.viInput$.pipe(debounceTime(600), distinctUntilChanged()).subscribe((t) => this.doTranslate(t, 'vi', 'en')),
    );
  }

  private refresh(): void {
    this.cdr.markForCheck();
  }

  onEnglishInput(v: string): void {
    this.lastSide = 'en';
    if (!v.trim()) {
      this.vietnameseText = '';
      return;
    }
    this.enInput$.next(v);
  }

  onVietnameseInput(v: string): void {
    this.lastSide = 'vi';
    if (!v.trim()) {
      this.englishText = '';
      return;
    }
    this.clearRecording();
    this.viInput$.next(v);
  }

  /** Google Translate (client=gtx) — giống web. */
  private doTranslate(text: string, from: string, to: string): void {
    if (!text.trim()) return;
    this.isLoading = true;
    this.translateError = '';
    this.refresh();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        try {
          const t = res[0]
            .filter((p: any[]) => p[0])
            .map((p: any[]) => p[0])
            .join('');
          if (to === 'vi') {
            this.vietnameseText = t;
            this.clearRecording();
          } else this.englishText = t;
        } catch {
          this.translateError = 'Cannot parse translation response.';
        }
        this.isLoading = false;
        this.refresh();
      },
      error: (err) => {
        this.translateError = err.status === 0 ? 'Cannot reach translation service.' : `Translation failed (${err.status}).`;
        this.isLoading = false;
        this.refresh();
      },
    });
  }

  /** Nút ⇄: dịch lại ngay từ ô vừa gõ (tương đương Enter ở web). */
  translateNow(): void {
    if (this.lastSide === 'vi' && this.vietnameseText.trim()) this.doTranslate(this.vietnameseText, 'vi', 'en');
    else if (this.englishText.trim()) this.doTranslate(this.englishText, 'en', 'vi');
    else if (this.vietnameseText.trim()) this.doTranslate(this.vietnameseText, 'vi', 'en');
  }

  speakEnglish(): void {
    if (!this.englishText || typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const s = new SpeechSynthesisUtterance(this.englishText);
    s.lang = 'en-US';
    s.rate = 1;
    s.pitch = 1;
    s.volume = 1;
    speechSynthesis.speak(s);
  }

  /** Đọc tiếng Việt bằng gTTS của backend (tts.service). */
  speakVietnamese(): void {
    if (!this.vietnameseText || this.isSpeakingVi) return;
    this.isSpeakingVi = true;
    this.deleteTtsAudio();
    this.tts.synthesize(this.vietnameseText).subscribe({
      next: (res) => {
        this.ttsAudioUrl = res.audioUrl;
        const audio = this.tts.playAudio(res.audioUrl);
        const done = () => {
          this.isSpeakingVi = false;
          this.refresh();
        };
        audio.onended = done;
        audio.onerror = done;
      },
      error: () => {
        this.isSpeakingVi = false;
        this.fb.toast('Cannot play Vietnamese audio.', 'error');
        this.refresh();
      },
    });
    this.refresh();
  }

  toggleRecording(): void {
    if (this.isRecording) this.stopRecording();
    else this.startRecording();
  }

  private startRecording(): void {
    this.clearRecording();
    this.audioChunks = [];
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.fb.toast('Recording is not supported on this device.', 'error');
      return;
    }

    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', ''].find((t) => !t || MediaRecorder.isTypeSupported(t)) ?? '';
    this.recordingMime = mime || 'audio/webm';

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
        this.mediaRecorder = recorder;

        recorder.addEventListener('dataavailable', (e: BlobEvent) => {
          if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
        });

        recorder.addEventListener('stop', async () => {
          stream.getTracks().forEach((t) => t.stop());
          if (this.audioChunks.length === 0) {
            this.transcribedText = 'Không thu được âm thanh. Vui lòng thử lại.';
            this.refresh();
            return;
          }
          const finalMime = recorder.mimeType || this.recordingMime;
          const rawBlob = new Blob(this.audioChunks, { type: finalMime });

          // Giữ bản ghi để nghe lại
          if (this.recordedBlobUrl) URL.revokeObjectURL(this.recordedBlobUrl);
          this.recordedBlobUrl = URL.createObjectURL(rawBlob);

          // Đổi sang WAV 16kHz → chấm theo câu tiếng Việt
          try {
            const wavBlob = await this.convertToWav(rawBlob);
            this.isTranscribing = true;
            this.gradeResult = null;
            this.wordResults = [];
            this.refresh();

            if (this.vietnameseText.trim()) {
              this.asr.grade(wavBlob, this.vietnameseText, 'wav').subscribe({
                next: (res) => {
                  this.transcribedText = res.transcript || '(Không nhận dạng được)';
                  this.gradeResult = res;
                  this.wordResults = res.words ?? [];
                  this.isTranscribing = false;
                  this.refresh();
                },
                error: () => {
                  this.transcribedText = 'Lỗi kết nối tới máy chủ.';
                  this.isTranscribing = false;
                  this.refresh();
                },
              });
            } else {
              this.asr.transcribe(wavBlob, 'wav').subscribe({
                next: (res) => {
                  this.transcribedText = res.text || '(Không nhận dạng được)';
                  this.isTranscribing = false;
                  this.refresh();
                },
                error: () => {
                  this.transcribedText = 'Lỗi kết nối tới máy chủ.';
                  this.isTranscribing = false;
                  this.refresh();
                },
              });
            }
          } catch {
            this.transcribedText = 'Lỗi chuyển đổi âm thanh.';
            this.isTranscribing = false;
            this.refresh();
          }
        });

        recorder.start(100);
        this.isRecording = true;
        this.refresh();
      })
      .catch(() => {
        this.fb.toast('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.', 'error');
      });
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.requestData();
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
    this.refresh();
  }

  playRecording(): void {
    if (!this.recordedBlobUrl) return;
    new Audio(this.recordedBlobUrl).play().catch(() => {});
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
    const write = (off: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
    };

    write(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    write(8, 'WAVE');
    write(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true);
    view.setUint32(28, 32000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    let off = 44;
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, pcm[i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  private clearRecording(): void {
    if (this.recordedBlobUrl) {
      URL.revokeObjectURL(this.recordedBlobUrl);
      this.recordedBlobUrl = '';
    }
    this.transcribedText = '';
    this.isTranscribing = false;
    this.gradeResult = null;
    this.wordResults = [];
  }

  private deleteTtsAudio(): void {
    if (this.ttsAudioUrl) {
      this.tts.deleteAudio(this.ttsAudioUrl);
      this.ttsAudioUrl = null;
    }
  }

  clearAll(): void {
    this.englishText = '';
    this.vietnameseText = '';
    this.translateError = '';
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    this.deleteTtsAudio();
    this.clearRecording();
    if (this.isRecording) this.stopRecording();
    this.refresh();
  }

  // ---- Hiển thị điểm ----
  get scoreTone(): 'excellent' | 'good' | 'poor' {
    const s = this.gradeResult?.score ?? 0;
    return s >= 85 ? 'excellent' : s >= 60 ? 'good' : 'poor';
  }

  get extraWords(): string[] {
    return this.gradeResult?.extraWords ?? [];
  }

  wordBg(status: string): string {
    return (WORD_COLORS[status] ?? WORD_COLORS['wrong'])[0];
  }

  wordFg(status: string): string {
    return (WORD_COLORS[status] ?? WORD_COLORS['wrong'])[1];
  }

  get recordHint(): string {
    if (this.isRecording) return 'Recording... tap to stop';
    if (this.isTranscribing) return 'Đang nhận dạng giọng nói...';
    return 'Tap to record';
  }

  ionViewWillLeave(): void {
    if (this.isRecording) this.stopRecording();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.deleteTtsAudio();
    if (this.isRecording) this.stopRecording();
    if (this.recordedBlobUrl) URL.revokeObjectURL(this.recordedBlobUrl);
  }
}
