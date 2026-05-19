import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = `${environment.apiBaseUrl}/reviews`;

  constructor(private http: HttpClient) {}

  private getOptions() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data, this.getOptions());
  }

  getByTeacherId(teacherId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${teacherId}`);
  }

  getByBookingId(bookingId: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/booking/${bookingId}`,
      this.getOptions(),
    );
  }
}
