import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ClassEnrollmentService {
  private apiUrl = `${environment.apiBaseUrl}/class-enrollments`;

  constructor(private http: HttpClient) {}

  private getOptions() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  enroll(classId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${classId}`, {}, this.getOptions());
  }

  cancel(enrollmentId: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${enrollmentId}/cancel`,
      {},
      this.getOptions(),
    );
  }

  getMyClasses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-classes`, this.getOptions());
  }

  getClassStudents(classId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/class/${classId}/students`,
      this.getOptions(),
    );
  }

  getStudentUpcomingSchedule(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/student/upcoming-schedule`,
      this.getOptions(),
    );
  }

  getTeacherUpcomingSchedule(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/teacher/upcoming-schedule`,
      this.getOptions(),
    );
  }
  getDetail(enrollmentId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${enrollmentId}`,
      this.getOptions(),
    );
  }
}
