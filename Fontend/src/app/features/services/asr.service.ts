import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AsrResponse {
  text: string;
  audioUrl: string;
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
}
