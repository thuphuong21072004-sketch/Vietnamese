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
   * payment success
   */
  success(paymentId: number, transactionCode: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${paymentId}/success`,

      {},

      {
        ...this.getOptions(),

        params: {
          transactionCode,
        },
      },
    );
  }

  /*
   * payment failed
   */
  failed(paymentId: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${paymentId}/failed`,

      {},

      this.getOptions(),
    );
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
  getMethodText(method: number): string {
    switch (method) {
      case 0:
        return 'VNPay';

      case 1:
        return 'Momo';

      case 2:
        return 'Paypal';

      default:
        return 'Unknown';
    }
  }
  createVNPayUrl(paymentId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${paymentId}/vnpay`,
      {},
      this.getOptions(),
    );
  }
}
