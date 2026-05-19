import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = `${environment.apiBaseUrl}/bookings`;

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
   * student tạo booking
   */
  create(availabilityId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${availabilityId}`,
      {},
      this.getOptions(),
    );
  }

  /*
   * student booking của mình
   */
  getMyBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/me`, this.getOptions());
  }

  /*
   * teacher booking của mình
   */
  getTeacherBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/teacher`, this.getOptions());
  }

  /*
   * chi tiết booking
   */
  getDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getOptions());
  }

  /*
   * teacher confirm booking
   */
  confirm(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/confirm`, {}, this.getOptions());
  }

  /*
   * huỷ booking
   */
  cancel(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/cancel`, {}, this.getOptions());
  }

  /*
   * complete booking
   */
  complete(id: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}/complete`,
      {},
      this.getOptions(),
    );
  }

  /*
   * helper status text
   */
  getStatusText(status: number): string {
    switch (status) {
      case 0:
        return 'Pending';

      case 1:
        return 'Booked';

      case 2:
        return 'Cancelled';

      case 3:
        return 'Completed';

      default:
        return 'Unknown';
    }
  }

  /*
   * helper status class
   */
  getStatusClass(status: number): string {
    switch (status) {
      case 0:
        return 'pending';

      case 1:
        return 'booked';

      case 2:
        return 'cancelled';

      case 3:
        return 'completed';

      default:
        return '';
    }
  }

  /*
   * helper avatar
   */
  getAvatar(booking: any): string {
    const avatar =
      booking?.teacherProfile?.user?.avatarUrl || booking?.teacher?.avatarUrl;

    if (!avatar) {
      return '';
    }

    if (avatar.startsWith('http')) {
      return avatar;
    }

    return `http://localhost:5108/uploads/${avatar}`;
  }

  /*
   * helper teacher name
   */
  getTeacherName(booking: any): string {
    return (
      booking?.teacherName || booking?.teacherProfile?.user?.name || 'Teacher'
    );
  }

  /*
   * helper student name
   */
  getStudentName(booking: any): string {
    return booking?.studentName || booking?.student?.name || 'Student';
  }
}
