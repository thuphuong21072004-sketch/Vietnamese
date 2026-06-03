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
  getMyBookings(status?: number, date?: string): Observable<any[]> {
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
   * teacher own bookings
   */
  getTeacherBookings(status?: number, date?: string): Observable<any[]> {
    let params = new HttpParams();

    if (status !== undefined && status !== null) {
      params = params.set('status', status.toString());
    }

    if (date) {
      params = params.set('date', date);
    }

    return this.http.get<any[]>(`${this.apiUrl}/teacher`, {
      ...this.getOptions(),
      params,
    });
  }

  /*
   * booking details
   */
  getDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getOptions());
  }

  /*
   * cancel booking
   */
  cancel(id: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}/cancel`,
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
        return 'Pending Payment';

      case 1:
        return 'Confirmed';

      case 2:
        return 'In Progress';

      case 3:
        return 'Completed';

      case 4:
        return 'Cancelled';

      case 5:
        return 'Refunded';

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
        return 'confirmed';

      case 2:
        return 'progress';

      case 3:
        return 'completed';

      case 4:
        return 'cancelled';

      case 5:
        return 'refunded';

      default:
        return '';
    }
  }

  /*
   * helper avatar
   */
  getAvatar(booking: any): string {
    const avatar =
      booking?.instructorProfile?.user?.avatarUrl ||
      booking?.instructor?.avatarUrl;

    if (!avatar) {
      return '';
    }

    if (avatar.startsWith('http')) {
      return avatar;
    }

    return `http://localhost:5108/uploads/${avatar}`;
  }

  getStudentAvatar(booking: any): string {
    const avatar = booking?.student?.avatarUrl;

    if (!avatar) {
      return '';
    }

    if (avatar.startsWith('http')) {
      return avatar;
    }

    return `http://localhost:5108/uploads/${avatar}`;
  }

  /*
   * helper booking duration
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
   * helper teacher price
   */
  getTeacherPrice(booking: any): number {
    return Number(
      booking?.instructorProfile?.pricePerHour ||
        booking?.instructor?.teacherProfile?.pricePerHour ||
        booking?.teacherProfile?.pricePerHour ||
        0,
    );
  }

  /*
   * helper teacher name
   */
  getTeacherName(booking: any): string {
    return (
      booking?.instructorProfile?.user?.name ||
      booking?.instructor?.name ||
      'Teacher'
    );
  }

  /*
   * helper student name
   */
  getStudentName(booking: any): string {
    return booking?.student?.name || 'Student';
  }
  /*
   * student statistics
   */
  getMyStatistics(month: number, year: number): Observable<any> {
    const params = new HttpParams().set('month', month).set('year', year);

    return this.http.get<any>(`${this.apiUrl}/me/statistics`, {
      ...this.getOptions(),
      params,
    });
  }

  /*
   * teacher statistics
   */
  getTeacherStatistics(month: number, year: number): Observable<any> {
    const params = new HttpParams().set('month', month).set('year', year);

    return this.http.get<any>(`${this.apiUrl}/teacher/statistics`, {
      ...this.getOptions(),
      params,
    });
  }

  /*
   * admin top teachers
   */
  getTopTeachers(month: number, year: number): Observable<any[]> {
    const params = new HttpParams().set('month', month).set('year', year);

    return this.http.get<any[]>(`${this.apiUrl}/admin/top-teachers`, {
      ...this.getOptions(),
      params,
    });
  }

  /*
   * admin top students
   */
  getTopStudents(month: number, year: number): Observable<any[]> {
    const params = new HttpParams().set('month', month).set('year', year);

    return this.http.get<any[]>(`${this.apiUrl}/admin/top-students`, {
      ...this.getOptions(),
      params,
    });
  }
  getTeacherSpecialty(booking: any): string {
    return (
      booking?.instructorProfile?.specialty ||
      booking?.instructor?.teacherProfile?.specialty ||
      ''
    );
  }

  getTeacherExperience(booking: any): number {
    return Number(
      booking?.instructorProfile?.experienceYears ||
        booking?.instructor?.teacherProfile?.experienceYears ||
        0,
    );
  }

  getTeacherDescription(booking: any): string {
    return (
      booking?.instructorProfile?.description ||
      booking?.instructor?.teacherProfile?.description ||
      ''
    );
  }

  getTeacherVideo(booking: any): string {
    const video =
      booking?.instructorProfile?.introVideoUrl ||
      booking?.instructor?.teacherProfile?.introVideoUrl;

    if (!video) {
      return '';
    }

    if (video.startsWith('http')) {
      return video;
    }

    return `http://localhost:5108/videos/${video}`;
  }
}
