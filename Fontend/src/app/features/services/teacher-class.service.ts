import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { TeacherClassDto, ClassSessionDto} from '../models/teacher-class.model';
import { ClassFilterDto } from '../models/class-filter.model';
import { environment }
  from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TeacherClassService {
  private apiUrl = `${environment.apiBaseUrl}/teacher-classes`;

  constructor(private http: HttpClient) {}

  private getOptions() {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return {
      headers,
    };
  }

  generateSchedule(
    teacherClass: TeacherClassDto,
  ): Observable<ClassSessionDto[]> {
    return this.http.post<ClassSessionDto[]>(
      `${this.apiUrl}/generate-schedule`,
      teacherClass,
      this.getOptions(),
    );
  }

  createClass(teacherClass: TeacherClassDto): Observable<TeacherClassDto> {
    return this.http.post<TeacherClassDto>(
      this.apiUrl,
      teacherClass,
      this.getOptions(),
    );
  }

  getAllClasses(): Observable<TeacherClassDto[]> {
    return this.http.get<TeacherClassDto[]>(this.apiUrl, this.getOptions());
  }

  getClassById(classId: number): Observable<TeacherClassDto> {
    return this.http.get<TeacherClassDto>(
      `${this.apiUrl}/${classId}`,
      this.getOptions(),
    );
  }
  getMaxPrice(teacherClass: TeacherClassDto): Observable<number> {
    return this.http.post<number>(
      `${this.apiUrl}/max-price`,
      teacherClass,
      this.getOptions(),
    );
  }
  searchMyClasses(filter: ClassFilterDto): Observable<TeacherClassDto[]> {
    return this.http.post<TeacherClassDto[]>(
      `${this.apiUrl}/my-classes`,
      filter,
      this.getOptions(),
    );
  }

  searchClasses(filter: ClassFilterDto): Observable<TeacherClassDto[]> {
    return this.http.post<TeacherClassDto[]>(
      `${this.apiUrl}/search`,
      filter,
      this.getOptions(),
    );
  }
  getCountries() {
    return this.http.get<any[]>(
      'https://restcountries.com/v3.1/all?fields=name',
    );
  }
  deleteClass(classId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${classId}`, this.getOptions());
  }
  updateSessions(classId: number, sessions: ClassSessionDto[]) {
    return this.http.put(
      `${this.apiUrl}/${classId}/sessions`,
      sessions,
      this.getOptions(),
    );
  }
}