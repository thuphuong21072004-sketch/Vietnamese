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

  create(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data, this.getOptions());
  }

  success(paymentId: number, transactionCode: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${paymentId}/success?transactionCode=${transactionCode}`,
      {},
      this.getOptions(),
    );
  }

  failed(paymentId: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${paymentId}/failed`,
      {},
      this.getOptions(),
    );
  }

  getByBooking(bookingId: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/booking/${bookingId}`,
      this.getOptions(),
    );
  }

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

      default:
        return 'Unknown';
    }
  }

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

      default:
        return '';
    }
  }
}
