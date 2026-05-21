import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TeacherAvailabilityService {
  private apiUrl = `${environment.apiBaseUrl}/teacher-availability`;

  constructor(private http: HttpClient) {}

  private getOptions() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  /*
   * student sees all available schedules
   */
  getAvailableSchedules(date?: string): Observable<any[]> {
    let params = new HttpParams();

    if (date) {
      params = params.set('date', date);
    }

    return this.http.get<any[]>(`${this.apiUrl}/available`, {
      params,
    });
  }

  /*
   * teacher sees own schedules
   */
  getMySchedules(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/me`, this.getOptions());
  }

  /*
   * view schedule detail
   */
  getDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /*
   * teacher creates schedule
   */
  create(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data, this.getOptions());
  }

  /*
   * teacher updates schedule
   */
  update(id: number, data: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/update/${id}`,
      data,
      this.getOptions(),
    );
  }

  /*
   * teacher deletes schedule
   */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, this.getOptions());
  }

  /*
   * helper get teacher avatar
   */
  getTeacherAvatar(item: any): string {
    const avatar =
      item?.teacherProfile?.avatarUrl || item?.teacherProfile?.user?.avatarUrl;

    if (!avatar) {
      return '';
    }

    if (avatar.startsWith('http')) {
      return avatar;
    }

    return `http://localhost:5108/uploads/${avatar}`;
  }

  /*
   * helper get teacher name
   */
  getTeacherName(item: any): string {
    return item?.teacherProfile?.user?.name || 'Teacher';
  }

  /*
   * helper specialty
   */
  getSpecialty(item: any): string {
    return item?.teacherProfile?.specialty || '';
  }

  /*
   * helper price
   */
  getPricePerHour(item: any): number {
    return item?.teacherProfile?.pricePerHour || 0;
  }

  /*
   * helper rating
   */
  getRating(item: any): number {
    return item?.teacherProfile?.ratingAverage || 0;
  }

  /*
   * helper reviews
   */
  getTotalReviews(item: any): number {
    return item?.teacherProfile?.totalReviews || 0;
  }
}
