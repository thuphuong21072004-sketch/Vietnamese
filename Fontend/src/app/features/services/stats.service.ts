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

export type ClassStatus = 'Upcoming' | 'Ongoing' | 'Completed';

export interface ClassRevenue {
  classId: number; title: string; teacherName: string; status: ClassStatus;
  startDate: string | null; endDate: string | null;
  price: number; maxStudents: number;
  studentCount: number; cancelledCount: number;
  totalRevenue: number; cancelledUnrefunded: number;
}

export interface StudentCourse {
  classId: number; title: string; teacherName: string; status: ClassStatus;
  enrollmentStatus: number; paidAt: string | null; amount: number;
}

export interface PayoutRecord {
  payoutId: number; teacherUserId: number; teacherName: string;
  amount: number; paidAt: string; note: string | null; createdBy: string | null;
}

export interface CreatePayout {
  teacherUserId: number; amount: number; paidAt?: string; note?: string;
}

export interface StudentPaymentStats {
  totalPaid: number; completedLearning: number;
  activeLearning: number; cancelledUnrefunded: number; refunded: number;
  monthlyBreakdown: MonthlyStudentBreakdown[];
  courseCount: number; courseTotal: number; courses: StudentCourse[];
}

export interface TeacherEarningsStats {
  totalFromStudents: number; completedEarnings: number;
  activeEarnings: number; cancelledUnrefunded: number;
  monthlyBreakdown: MonthlyTeacherBreakdown[];
  classCount: number; studentCount: number; classes: ClassRevenue[];
  // lũy kế, không theo kỳ
  totalOwed: number; totalPaidOut: number; balance: number;
}

export interface TeacherPayout {
  userId: number; teacherName: string; email: string;
  totalFromStudents: number; completedEarnings: number;
  activeEarnings: number; cancelledUnrefunded: number;
  classCount: number; studentCount: number; classes: ClassRevenue[];
  // đối soát lũy kế: balance > 0 còn thiếu, < 0 trả thừa
  groupOwed: number; privateOwed: number; totalOwed: number;
  totalPaidOut: number; balance: number; lastPaidAt: string | null;
}

export interface AdminPaymentStats {
  totalStudentPayments: number; totalCompletedLearning: number;
  totalActiveLearning: number; totalCancelledUnrefunded: number; totalRefunded: number;
  monthlyBreakdown: MonthlyAdminBreakdown[];
  teacherPayouts: TeacherPayout[];
  uniqueStudentCount: number;
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

  getPayouts(teacherUserId?: number): Observable<PayoutRecord[]> {
    let p = new HttpParams();
    if (teacherUserId) p = p.set('teacherUserId', teacherUserId);
    return this.http.get<PayoutRecord[]>(`${this.url}/admin/payouts`, { params: p });
  }

  createPayout(body: CreatePayout): Observable<PayoutRecord> {
    return this.http.post<PayoutRecord>(`${this.url}/admin/payouts`, body);
  }

  deletePayout(payoutId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/admin/payouts/${payoutId}`);
  }
}
