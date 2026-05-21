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
   * student creates booking
   */
  create(availabilityId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${availabilityId}`,
      null,
      this.getOptions(),
    );
  }

  /*
   * student own bookings
   */
  getMyBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/me`, this.getOptions());
  }

  /*
   * teacher own bookings
   */
  getTeacherBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/teacher`, this.getOptions());
  }

  /*
   * booking details
   */
  getDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getOptions());
  }

  /*
   * teacher confirm booking
   */
  confirm(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/confirm`, null, this.getOptions());
  }

  /*
   * cancel booking
   */
  cancel(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/cancel`, null, this.getOptions());
  }

  /*
   * complete booking
   */
  complete(id: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}/complete`,
      null,
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
      booking?.teacherProfile?.avatarUrl ||
      booking?.teacherProfile?.user?.avatarUrl ||
      booking?.teacher?.avatarUrl;

    if (!avatar) {
      return '';
    }

    if (avatar.startsWith('http')) {
      return avatar;
    }

    return `http://localhost:5108/uploads/${avatar}`;
  }

  /*
   * helper booking duration in hours
   */
  getDurationHours(booking: any): number {
    if (!booking?.startTime || !booking?.endTime) {
      return 0;
    }

    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const diff = Math.max(0, end.getTime() - start.getTime());
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  }

  /*
   * helper total booking amount
   */
  getBookingAmount(booking: any): number {
    const price = this.getTeacherPrice(booking);
    const hours = this.getDurationHours(booking);

    return Math.round((price * hours + Number.EPSILON) * 100) / 100;
  }

  /*
   * helper teacher hourly price
   */
  getTeacherPrice(booking: any): number {
    return Number(booking?.teacherProfile?.pricePerHour || 0);
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
