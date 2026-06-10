import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AsrResponse {
  text: string;
  audioUrl: string;
}

export interface WordResult {
  word: string;
  /** correct | accent | character | wrong | missing */
  status: 'correct' | 'accent' | 'character' | 'wrong' | 'missing';
  actual?: string;
  score?: number;
}

export interface PronunciationError {
  type: string;
  expected?: string;
  actual?: string;
  score?: number;
}

export interface PronunciationGradeResponse {
  transcript: string;
  score: number;
  words: WordResult[];
  extraWords: string[];
  errors: PronunciationError[];
}

@Injectable({
  providedIn: 'root',
})
export class AsrService {
  private readonly url = `${environment.apiBaseUrl}/asr`;

  constructor(private http: HttpClient) {}

  transcribe(audioBlob: Blob, ext: string = 'webm'): Observable<AsrResponse> {
    const form = new FormData();
    form.append('audio', audioBlob, `recording.${ext}`);
    return this.http.post<AsrResponse>(this.url, form);
  }

  grade(audioBlob: Blob, reference: string, ext: string = 'wav'): Observable<PronunciationGradeResponse> {
    const form = new FormData();
    form.append('audio', audioBlob, `recording.${ext}`);
    form.append('reference', reference);
    return this.http.post<PronunciationGradeResponse>(`${this.url}/grade`, form);
  }

  compareText(text: string, reference: string): Observable<PronunciationGradeResponse> {
    const form = new FormData();
    form.append('text', text);
    form.append('reference', reference);
    return this.http.post<PronunciationGradeResponse>(`${this.url}/compare`, form);
  }
}
