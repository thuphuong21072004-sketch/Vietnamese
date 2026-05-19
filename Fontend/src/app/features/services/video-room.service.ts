import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VideoRoomService {
  private apiUrl = `${environment.apiBaseUrl}/video-rooms`;

  constructor(private http: HttpClient) {}

  private getOptions() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  create(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${bookingId}`, {}, this.getOptions());
  }

  getByBookingId(bookingId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${bookingId}`, this.getOptions());
  }
}
