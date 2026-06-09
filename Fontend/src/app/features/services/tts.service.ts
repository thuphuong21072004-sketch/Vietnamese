import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface TtsResponse {
  audioUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class TtsService {
  private readonly url = `${environment.apiBaseUrl}/tts`;

  constructor(private http: HttpClient) {}

  synthesize(text: string): Observable<TtsResponse> {
    return this.http.post<TtsResponse>(this.url, { text });
  }

  playAudio(audioUrl: string): HTMLAudioElement {
    const base = environment.apiBaseUrl.replace('/api', '');
    const audio = new Audio(`${base}${audioUrl}`);
    audio.play();
    return audio;
  }

  deleteAudio(audioUrl: string): void {
    const fileName = audioUrl.split('/').pop();
    if (!fileName) return;
    this.http.delete(`${this.url}?file=${fileName}`).subscribe({ error: () => {} });
  }
}
