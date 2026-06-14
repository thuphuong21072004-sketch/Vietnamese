import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MatchRequestDto, StudentTripDto, TeacherScheduleDto } from '../models/travel.model';

@Injectable({ providedIn: 'root' })
export class TravelService {
  private apiUrl = `${environment.apiBaseUrl}/travel`;

  constructor(private http: HttpClient) {}

  private getOptions() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
    };
  }

  // ── Teacher Schedules ───────────────────────────────────────────────────────

  createSchedule(dto: Partial<TeacherScheduleDto>): Observable<TeacherScheduleDto> {
    return this.http.post<TeacherScheduleDto>(`${this.apiUrl}/teacher/schedules`, dto, this.getOptions());
  }

  getMySchedules(): Observable<TeacherScheduleDto[]> {
    return this.http.get<TeacherScheduleDto[]>(`${this.apiUrl}/teacher/schedules`, this.getOptions());
  }

  updateSchedule(id: number, dto: Partial<TeacherScheduleDto>): Observable<TeacherScheduleDto> {
    return this.http.put<TeacherScheduleDto>(`${this.apiUrl}/teacher/schedules/${id}`, dto, this.getOptions());
  }

  deleteSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teacher/schedules/${id}`, this.getOptions());
  }

  // ── Student Trips ───────────────────────────────────────────────────────────

  createTrip(dto: Partial<StudentTripDto>): Observable<StudentTripDto> {
    return this.http.post<StudentTripDto>(`${this.apiUrl}/student/trips`, dto, this.getOptions());
  }

  getMyTrips(): Observable<StudentTripDto[]> {
    return this.http.get<StudentTripDto[]>(`${this.apiUrl}/student/trips`, this.getOptions());
  }

  updateTrip(id: number, dto: Partial<StudentTripDto>): Observable<StudentTripDto> {
    return this.http.put<StudentTripDto>(`${this.apiUrl}/student/trips/${id}`, dto, this.getOptions());
  }

  deleteTrip(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/student/trips/${id}`, this.getOptions());
  }

  // ── Matching ────────────────────────────────────────────────────────────────

  getSuggestedTeachers(tripId: number): Observable<TeacherScheduleDto[]> {
    return this.http.get<TeacherScheduleDto[]>(`${this.apiUrl}/student/matches/${tripId}`, this.getOptions());
  }

  getSuggestedStudents(scheduleId: number): Observable<StudentTripDto[]> {
    return this.http.get<StudentTripDto[]>(`${this.apiUrl}/teacher/matches/${scheduleId}`, this.getOptions());
  }

  // ── Requests ────────────────────────────────────────────────────────────────

  sendRequest(scheduleId: number, tripId: number, requestType: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/requests`, { scheduleId, tripId, requestType }, this.getOptions());
  }

  acceptRequest(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/requests/${id}/accept`, {}, this.getOptions());
  }

  rejectRequest(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/requests/${id}/reject`, {}, this.getOptions());
  }

  cancelRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/requests/${id}`, this.getOptions());
  }

  getIncomingRequests(): Observable<MatchRequestDto[]> {
    return this.http.get<MatchRequestDto[]>(`${this.apiUrl}/requests/incoming`, this.getOptions());
  }

  getOutgoingRequests(): Observable<MatchRequestDto[]> {
    return this.http.get<MatchRequestDto[]>(`${this.apiUrl}/requests/outgoing`, this.getOptions());
  }

  getRequestsByTrip(tripId: number): Observable<MatchRequestDto[]> {
    return this.http.get<MatchRequestDto[]>(`${this.apiUrl}/requests/by-trip/${tripId}`, this.getOptions());
  }

  getRequestsBySchedule(scheduleId: number): Observable<MatchRequestDto[]> {
    return this.http.get<MatchRequestDto[]>(`${this.apiUrl}/requests/by-schedule/${scheduleId}`, this.getOptions());
  }

  getRequestDetail(id: number): Observable<MatchRequestDto> {
    return this.http.get<MatchRequestDto>(`${this.apiUrl}/requests/${id}`, this.getOptions());
  }

  linkClassToRequest(requestId: number, classId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/requests/${requestId}/link-class/${classId}`, {}, this.getOptions());
  }
}
