
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders
} from '@angular/common/http';

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
export class SpeakComponent {

  englishText: string = '';

  vietnameseText: string = '';

  isLoading: boolean = false;

  constructor(private http: HttpClient) { }

  translateFromEnglish() {

    if (!this.englishText.trim()) {
      return;
    }

    this.isLoading = true;

    const body = {
      q: this.englishText,
      source: 'en',
      target: 'vi'
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.http.post<any>(
      'https://libretranslate.com/translate',
      body,
      { headers }
    ).subscribe({

      next: (res) => {

        this.vietnameseText = res.translatedText;

        this.isLoading = false;
      },

      error: (err) => {

        console.error(err);

        this.vietnameseText = 'Lỗi dịch ngôn ngữ';

        this.isLoading = false;
      }

    });
  }

  translateFromVietnamese() {

    if (!this.vietnameseText.trim()) {
      return;
    }

    this.isLoading = true;

    const body = {
      q: this.vietnameseText,
      source: 'vi',
      target: 'en'
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.http.post<any>(
      'https://libretranslate.com/translate',
      body,
      { headers }
    ).subscribe({

      next: (res) => {

        this.englishText = res.translatedText;

        this.isLoading = false;
      },

      error: (err) => {

        console.error(err);

        this.englishText = 'Translation error';

        this.isLoading = false;
      }

    });
  }

  speakText(text: string, lang: string) {

    if (!text) {
      return;
    }

    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = lang;

    speech.rate = 1;

    speech.pitch = 1;

    speech.volume = 1;

    speechSynthesis.speak(speech);
  }

  clearAll() {

    this.englishText = '';

    this.vietnameseText = '';

    speechSynthesis.cancel();
  }
}