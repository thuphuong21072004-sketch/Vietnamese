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
   * student xem lịch trống
   */
  getAvailableSchedules(date?: string): Observable<any[]> {
    let params = new HttpParams();

    if (date) {
      params = params.set('date', date);
    }

    return this.http.get<any[]>(`${this.apiUrl}/available`, { params });
  }

  /*
   * teacher xem lịch của mình
   */
  getMySchedules(status?: number, date?: string): Observable<any[]> {
    let params = new HttpParams();

    if (status !== undefined && status !== null) {
      params = params.set('status', status.toString());
    }

    if (date) {
      params = params.set('date', date);
    }

    return this.http.get<any[]>(`${this.apiUrl}/me`, {
      ...this.getOptions(),
      params,
    });
  }

  /*
   * chi tiết lịch
   */
  getDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /*
   * tạo lịch
   */
  create(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data, this.getOptions());
  }

  /*
   * cập nhật lịch
   */
  update(id: number, data: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/update/${id}`,
      data,
      this.getOptions(),
    );
  }

  /*
   * xoá lịch
   */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, this.getOptions());
  }

  /*
   * avatar teacher
   */
  getTeacherAvatar(item: any): string {
    const avatar =
      item?.instructorProfile?.avatarUrl ||
      item?.instructorProfile?.user?.avatarUrl;

    if (!avatar) {
      return '';
    }

    if (avatar.startsWith('http')) {
      return avatar;
    }

    return `http://localhost:5108/uploads/${avatar}`;
  }

  /*
   * tên teacher
   */
  getTeacherName(item: any): string {
    return item?.instructor?.name || 'Teacher';
  }

  /*
   * chuyên môn
   */
  getSpecialty(item: any): string {
    return item?.instructorProfile?.specialty || '';
  }

  /*
   * giá dạy
   */
  getPricePerHour(item: any): number {
    return item?.instructorProfile?.pricePerHour || 0;
  }

  /*
   * rating
   */
  getRating(item: any): number {
    return item?.instructorProfile?.ratingAverage || 0;
  }

  /*
   * số review
   */
  getTotalReviews(item: any): number {
    return item?.instructorProfile?.totalReviews || 0;
  }
}
