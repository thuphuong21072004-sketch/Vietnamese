
import { Component, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TtsService } from '../../../../features/services/tts.service';
import { AsrService, PronunciationGradeResponse, WordResult } from '../../../../features/services/asr.service';

@Component({
  selector: 'app-speak',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './speak.component.html',
  styleUrls: ['./speak.component.css']
})
export class SpeakComponent implements OnDestroy {

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

  private ttsAudioUrl: string | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingMime = 'audio/webm';
  private enInput$ = new Subject<string>();
  private viInput$ = new Subject<string>();
  private subs: Subscription[] = [];

  constructor(
    private http: HttpClient,
    private tts: TtsService,
    private asr: AsrService,
    private zone: NgZone
  ) {
    this.subs.push(
      this.enInput$.pipe(debounceTime(600), distinctUntilChanged())
        .subscribe(t => this.doTranslate(t, 'en', 'vi')),
      this.viInput$.pipe(debounceTime(600), distinctUntilChanged())
        .subscribe(t => this.doTranslate(t, 'vi', 'en'))
    );
  }

  onEnglishInput(v: string) {
    if (!v.trim()) { this.vietnameseText = ''; return; }
    this.enInput$.next(v);
  }

  onVietnameseInput(v: string) {
    if (!v.trim()) { this.englishText = ''; return; }
    this.clearRecording();
    this.viInput$.next(v);
  }

  private doTranslate(text: string, from: string, to: string) {
    if (!text.trim()) return;
    this.isLoading = true;
    this.translateError = '';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        try {
          const t = res[0].filter((p: any[]) => p[0]).map((p: any[]) => p[0]).join('');
          if (to === 'vi') this.vietnameseText = t;
          else this.englishText = t;
        } catch { this.translateError = 'Cannot parse translation response.'; }
        this.isLoading = false;
      },
      error: (err) => {
        this.translateError = err.status === 0
          ? 'Cannot reach translation service.'
          : `Translation failed (${err.status}).`;
        this.isLoading = false;
      }
    });
  }

  translateFromEnglish() { this.doTranslate(this.englishText, 'en', 'vi'); }
  translateFromVietnamese() { this.doTranslate(this.vietnameseText, 'vi', 'en'); }

  speakText(text: string, lang: string) {
    if (!text) return;
    speechSynthesis.cancel();
    const s = new SpeechSynthesisUtterance(text);
    s.lang = lang; s.rate = 1; s.pitch = 1; s.volume = 1;
    speechSynthesis.speak(s);
  }

  speakVietnamese() {
    if (!this.vietnameseText || this.isSpeakingVi) return;
    this.isSpeakingVi = true;
    this.deleteTtsAudio();
    this.tts.synthesize(this.vietnameseText).subscribe({
      next: (res) => {
        this.ttsAudioUrl = res.audioUrl;
        const audio = this.tts.playAudio(res.audioUrl);
        audio.onended = () => { this.isSpeakingVi = false; };
        audio.onerror = () => { this.isSpeakingVi = false; };
      },
      error: () => { this.isSpeakingVi = false; }
    });
  }

  toggleRecording() {
    if (this.isRecording) this.stopRecording();
    else this.startRecording();
  }

  private startRecording() {
    this.clearRecording();
    this.audioChunks = [];

    const mime = ['audio/webm;codecs=opus', 'audio/webm', '']
      .find(t => !t || MediaRecorder.isTypeSupported(t)) ?? '';
    this.recordingMime = mime || 'audio/webm';

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      this.mediaRecorder = recorder;

      recorder.addEventListener('dataavailable', (e: BlobEvent) => {
        if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
      });

      recorder.addEventListener('stop', () => {
        stream.getTracks().forEach(t => t.stop());
        this.zone.run(async () => {
          if (this.audioChunks.length === 0) {
            this.transcribedText = 'Không thu được âm thanh. Vui lòng thử lại.';
            return;
          }
          const finalMime = recorder.mimeType || this.recordingMime;
          const webmBlob = new Blob(this.audioChunks, { type: finalMime });

          // Keep local blob for playback
          if (this.recordedBlobUrl) URL.revokeObjectURL(this.recordedBlobUrl);
          this.recordedBlobUrl = URL.createObjectURL(webmBlob);

          // Convert to WAV → grade against reference text
          try {
            const wavBlob = await this.convertToWav(webmBlob);
            this.isTranscribing = true;
            this.gradeResult = null;
            this.wordResults = [];

            if (this.vietnameseText.trim()) {
              this.asr.grade(wavBlob, this.vietnameseText, 'wav').subscribe({
                next: (res) => {
                  this.transcribedText = res.transcript || '(Không nhận dạng được)';
                  this.gradeResult = res;
                  this.wordResults = res.words ?? [];
                  this.isTranscribing = false;
                },
                error: () => {
                  this.transcribedText = 'Lỗi kết nối tới máy chủ.';
                  this.isTranscribing = false;
                }
              });
            } else {
              this.asr.transcribe(wavBlob, 'wav').subscribe({
                next: (res) => {
                  this.transcribedText = res.text || '(Không nhận dạng được)';
                  this.isTranscribing = false;
                },
                error: () => {
                  this.transcribedText = 'Lỗi kết nối tới máy chủ.';
                  this.isTranscribing = false;
                }
              });
            }
          } catch {
            this.transcribedText = 'Lỗi chuyển đổi âm thanh.';
          }
        });
      });

      recorder.start(100);
      this.zone.run(() => { this.isRecording = true; });
    }).catch(() => {
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    });
  }

  private stopRecording() {
    if (this.mediaRecorder?.state !== 'inactive') {
      this.mediaRecorder?.requestData();
      this.mediaRecorder?.stop();
    }
    this.isRecording = false;
  }

  playRecording() {
    if (!this.recordedBlobUrl) return;
    new Audio(this.recordedBlobUrl).play();
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

  private clearRecording() {
    if (this.recordedBlobUrl) { URL.revokeObjectURL(this.recordedBlobUrl); this.recordedBlobUrl = ''; }
    this.transcribedText = '';
    this.isTranscribing = false;
    this.gradeResult = null;
    this.wordResults = [];
  }

  private deleteTtsAudio() {
    if (this.ttsAudioUrl) { this.tts.deleteAudio(this.ttsAudioUrl); this.ttsAudioUrl = null; }
  }

  clearAll() {
    this.englishText = '';
    this.vietnameseText = '';
    this.translateError = '';
    speechSynthesis.cancel();
    this.deleteTtsAudio();
    this.clearRecording();
    if (this.isRecording) this.stopRecording();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.deleteTtsAudio();
    if (this.isRecording) this.stopRecording();
    if (this.recordedBlobUrl) URL.revokeObjectURL(this.recordedBlobUrl);
  }
}
