import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

import { PaymentDTO } from '../models/payment.model';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly apiUrl = `${environment.apiBaseUrl}/payments`;

  constructor(private http: HttpClient) {}

  create(payment: PaymentDTO): Observable<PaymentDTO> {
    return this.http.post<PaymentDTO>(`${this.apiUrl}/create`, payment);
  }

  getCurrencies(amount: number): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/currencies`, {
      params: {
        amount,
      },
    });
  }

  createStripeUrl(paymentId: number, currency: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${paymentId}/stripe?currency=${currency}`,
      {},
    );
  }

  getByRef(refName: string, refId: number): Observable<PaymentDTO> {
    return this.http.get<PaymentDTO>(`${this.apiUrl}/${refName}/${refId}`);
  }

  getBankInfo(amount: number = 0): Observable<any> {
    return this.http.get(`${this.apiUrl}/bank-info?amount=${amount}`);
  }

  bankTransfer(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/bank-transfer`, data);
  }

  getPendingBankTransfers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bank-transfers`);
  }

  confirmBankTransfer(paymentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${paymentId}/confirm`, {});
  }
}
