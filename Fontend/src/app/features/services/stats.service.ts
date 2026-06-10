import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MonthlyStudentBreakdown {
  year: number; month: number;
  totalPaid: number; completedLearning: number;
  activeLearning: number; cancelledUnrefunded: number; refunded: number;
}

export interface MonthlyTeacherBreakdown {
  year: number; month: number;
  totalFromStudents: number; completedEarnings: number;
  activeEarnings: number; cancelledUnrefunded: number;
}

export interface MonthlyAdminBreakdown {
  year: number; month: number;
  totalPaid: number; completedLearning: number;
  activeLearning: number; cancelledUnrefunded: number; refunded: number;
}

export interface StudentPaymentStats {
  totalPaid: number; completedLearning: number;
  activeLearning: number; cancelledUnrefunded: number; refunded: number;
  monthlyBreakdown: MonthlyStudentBreakdown[];
}

export interface TeacherEarningsStats {
  totalFromStudents: number; completedEarnings: number;
  activeEarnings: number; cancelledUnrefunded: number;
  monthlyBreakdown: MonthlyTeacherBreakdown[];
}

export interface TeacherPayout {
  userId: number; teacherName: string; email: string;
  totalFromStudents: number; completedEarnings: number;
  activeEarnings: number; cancelledUnrefunded: number;
}

export interface StudentPaymentSummary {
  userId: number; studentName: string; email: string;
  totalPaid: number; completedLearning: number;
  activeLearning: number; cancelledUnrefunded: number; refunded: number;
}

export interface AdminPaymentStats {
  totalStudentPayments: number; totalCompletedLearning: number;
  totalActiveLearning: number; totalCancelledUnrefunded: number; totalRefunded: number;
  monthlyBreakdown: MonthlyAdminBreakdown[];
  teacherPayouts: TeacherPayout[];
  studentSummaries: StudentPaymentSummary[];
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly url = `${environment.apiBaseUrl}/stats`;

  constructor(private http: HttpClient) {}

  private params(year?: number, month?: number): HttpParams {
    let p = new HttpParams();
    if (year) p = p.set('year', year);
    if (month) p = p.set('month', month);
    return p;
  }

  getStudentStats(year?: number, month?: number): Observable<StudentPaymentStats> {
    return this.http.get<StudentPaymentStats>(`${this.url}/student`, { params: this.params(year, month) });
  }

  getTeacherStats(year?: number, month?: number): Observable<TeacherEarningsStats> {
    return this.http.get<TeacherEarningsStats>(`${this.url}/teacher`, { params: this.params(year, month) });
  }

  getAdminStats(year?: number, month?: number): Observable<AdminPaymentStats> {
    return this.http.get<AdminPaymentStats>(`${this.url}/admin`, { params: this.params(year, month) });
  }
}
