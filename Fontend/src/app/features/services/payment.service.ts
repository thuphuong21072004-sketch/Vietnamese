import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private apiUrl = `${environment.apiBaseUrl}/payments`;

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
   * create payment
   */
  create(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data, this.getOptions());
  }

  /*
   * payment by booking
   */
  getByBooking(bookingId: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/booking/${bookingId}`,

      this.getOptions(),
    );
  }

  /*
   * payment status text
   */
  getStatusText(status: number): string {
    switch (status) {
      case 0:
        return 'Pending';

      case 1:
        return 'Success';

      case 2:
        return 'Failed';

      case 3:
        return 'Refunded';

      case 4:
        return 'Expired';

      default:
        return 'Unknown';
    }
  }

  /*
   * payment status class
   */
  getStatusClass(status: number): string {
    switch (status) {
      case 0:
        return 'pending';

      case 1:
        return 'success';

      case 2:
        return 'failed';

      case 3:
        return 'refunded';

      case 4:
        return 'expired';

      default:
        return '';
    }
  }

  /*
   * payment method text
   */
  getCurrencies(amount: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/currencies`, {
      ...this.getOptions(),
      params: {
        amount,
      },
    });
  }
  
  createStripeUrl(paymentId: number, currency: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${paymentId}/stripe`,
      {},
      {
        ...this.getOptions(),
        params: {
          currency,
        },
      },
    );
  }

  /*
   * student payment statistics
   */
  getMyStatistics(month: number, year: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/me/statistics`, {
      ...this.getOptions(),
      params: {
        month,
        year,
      },
    });
  }
  /*
   * student payment history
   */
  getMyPayments(
    month: number,
    year: number,
    page: number = 1,
    pageSize: number = 10,
  ): Observable<any> {
    return this.http.get(`${this.apiUrl}/me/payments`, {
      ...this.getOptions(),
      params: {
        month,
        year,
        page,
        pageSize,
      },
    });
  }

  /*
   * teacher salary statistics
   */
  getMySalaryStatistics(month: number, year: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/teacher/salary-statistics`, {
      ...this.getOptions(),
      params: {
        month,
        year,
      },
    });
  }

  /*
   * teacher salary history
   */
  getMySalaryHistory(
    month: number,
    year: number,
    page: number = 1,
    pageSize: number = 10,
  ): Observable<any> {
    return this.http.get(`${this.apiUrl}/teacher/salary-history`, {
      ...this.getOptions(),
      params: {
        month,
        year,
        page,
        pageSize,
      },
    });
  }

  /*
   * admin finance overview
   */
  getAdminFinanceOverview(month: number, year: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/finance-overview`, {
      ...this.getOptions(),
      params: {
        month,
        year,
      },
    });
  }

  /*
   * admin student finance
   */
  getStudentFinanceReport(
    month: number,
    year: number,
    page: number = 1,
    pageSize: number = 10,
  ): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/student-finance`, {
      ...this.getOptions(),
      params: {
        month,
        year,
        page,
        pageSize,
      },
    });
  }

  /*
   * admin teacher finance
   */
  getTeacherFinanceReport(
    month: number,
    year: number,
    page: number = 1,
    pageSize: number = 10,
  ): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/teacher-finance`, {
      ...this.getOptions(),
      params: {
        month,
        year,
        page,
        pageSize,
      },
    });
  }
}
