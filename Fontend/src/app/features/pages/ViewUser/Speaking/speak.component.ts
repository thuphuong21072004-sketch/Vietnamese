
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TtsService } from '../../../../features/services/tts.service';

@Component({
  selector: 'app-speak',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './speak.component.html',
  styleUrls: ['./speak.component.css']
})
export class SpeakComponent implements OnDestroy {

  englishText: string = '';
  vietnameseText: string = '';
  isLoading: boolean = false;
  isSpeakingVi: boolean = false;

  private enInput$ = new Subject<string>();
  private viInput$ = new Subject<string>();
  private subs: Subscription[] = [];

  constructor(private http: HttpClient, private tts: TtsService) {
    this.subs.push(
      this.enInput$.pipe(
        debounceTime(600),
        distinctUntilChanged()
      ).subscribe(text => this.doTranslate(text, 'en', 'vi')),

      this.viInput$.pipe(
        debounceTime(600),
        distinctUntilChanged()
      ).subscribe(text => this.doTranslate(text, 'vi', 'en'))
    );
  }

  onEnglishInput(value: string) {
    if (!value.trim()) {
      this.vietnameseText = '';
      return;
    }
    this.enInput$.next(value);
  }

  onVietnameseInput(value: string) {
    if (!value.trim()) {
      this.englishText = '';
      return;
    }
    this.viInput$.next(value);
  }

  private doTranslate(text: string, from: string, to: string) {
    if (!text.trim()) return;

    this.isLoading = true;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const translated = res[0]
          .filter((part: any[]) => part[0])
          .map((part: any[]) => part[0])
          .join('');

        if (to === 'vi') {
          this.vietnameseText = translated;
        } else {
          this.englishText = translated;
        }
        this.isLoading = false;
      },
      error: () => {
        if (to === 'vi') {
          this.vietnameseText = 'Lỗi dịch ngôn ngữ';
        } else {
          this.englishText = 'Translation error';
        }
        this.isLoading = false;
      }
    });
  }

  translateFromEnglish() {
    this.doTranslate(this.englishText, 'en', 'vi');
  }

  translateFromVietnamese() {
    this.doTranslate(this.vietnameseText, 'vi', 'en');
  }

  speakText(text: string, lang: string) {
    if (!text) return;
    speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = lang;
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;
    speechSynthesis.speak(speech);
  }

  speakVietnamese() {
    if (!this.vietnameseText || this.isSpeakingVi) return;
    this.isSpeakingVi = true;
    this.tts.synthesize(this.vietnameseText).subscribe({
      next: (res) => {
        const audio = this.tts.playAudio(res.audioUrl);
        audio.onended = () => { this.isSpeakingVi = false; };
        audio.onerror = () => { this.isSpeakingVi = false; };
      },
      error: () => { this.isSpeakingVi = false; }
    });
  }

  clearAll() {
    this.englishText = '';
    this.vietnameseText = '';
    speechSynthesis.cancel();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
}