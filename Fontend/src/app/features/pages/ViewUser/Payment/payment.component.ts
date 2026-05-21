import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { PaymentService } from '../../../services/payment.service';

import { BookingService } from '../../../services/booking.service';

@Component({
  selector: 'app-payment',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './payment.component.html',

  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent implements OnInit {
  bookingId = 0;

  booking: any = null;

  payment: any = null;

  selectedMethod: 'QR' | 'VNPAY' = 'QR';

  loading = false;

  qrData = '';

  qrUrl = '';

  paymentLink = '';

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    public paymentService: PaymentService,

    public bookingService: BookingService,
  ) {}

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.paramMap.get('id'));

    this.loadBooking();
    this.loadPayment();
  }

  loadBooking() {
    this.bookingService.getDetail(this.bookingId).subscribe({
      next: (res) => {
        this.booking = res;
        this.updatePaymentData();
      },
      error: (err) => {
        console.error(err);
        this.booking = null;
      },
    });
  }

  loadPayment() {
    this.paymentService.getByBooking(this.bookingId).subscribe({
      next: (res) => {
        this.payment = res;
        if (res?.paymentMethod) {
          this.selectedMethod = res.paymentMethod === 'QR' ? 'QR' : 'VNPAY';
        }
        this.updatePaymentData();
      },
      error: () => {
        this.payment = null;
      },
    });
  }

  getAmount(): number {
    if (!this.booking || !this.booking.teacherProfile) {
      return 0;
    }

    const start = new Date(this.booking.startTime);
    const end = new Date(this.booking.endTime);
    const durationHours = Math.max(
      0.5,
      (end.getTime() - start.getTime()) / (1000 * 60 * 60),
    );

    return Math.round(this.booking.teacherProfile.pricePerHour * durationHours * 100) / 100;
  }

  getDuration(): string {
    if (!this.booking) {
      return '-';
    }

    const start = new Date(this.booking.startTime);
    const end = new Date(this.booking.endTime);
    const minutes = Math.max(30, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return `${hours > 0 ? hours + 'h ' : ''}${remaining}m`;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  updatePaymentData() {
    const amount = this.getAmount();
    this.paymentLink = `https://vnpay.vn/pay?amount=${amount}&bookingId=${this.bookingId}`;
    this.qrData = `vnpay://pay?amount=${amount}&bookingId=${this.bookingId}&note=VietPhuong`;
    this.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(this.qrData)}`;
  }

  onMethodChanged() {
    if (this.payment) {
      this.updatePaymentData();
    }
  }

  pay() {
    if (!this.booking) {
      alert('Booking information not loaded yet');
      return;
    }

    const amount = this.getAmount();
    if (amount <= 0) {
      alert('Cannot proceed with payment: invalid amount');
      return;
    }

    this.loading = true;

    const body = {
      bookingId: this.bookingId,
      amount,
      paymentMethod: this.selectedMethod,
    };

    this.paymentService.create(body).subscribe({
      next: (res) => {
        this.payment = { ...res, status: 0, paymentMethod: this.selectedMethod };
        this.updatePaymentData();
        this.loading = false;
        alert('Payment created. Please scan the QR or use VNPAY to complete payment.');
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        alert(err.error?.message || 'Payment failed');
      },
    });
  }

  confirmPayment() {
    if (!this.payment) {
      return;
    }

    this.loading = true;
    const transactionCode = `${this.selectedMethod}_${Date.now()}`;

    this.paymentService.success(this.payment.paymentId, transactionCode).subscribe({
      next: () => {
        this.loading = false;
        this.payment.status = 1;
        this.payment.transactionCode = transactionCode;
        alert('Payment confirmed successfully.');
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        alert(err.error?.message || 'Payment confirmation failed');
      },
    });
  }

  back() {
    history.back();
  }

  getStatusText(status: number): string {
    return this.paymentService.getStatusText(status);
  }

  getStatusClass(status: number): string {
    return this.paymentService.getStatusClass(status);
  }

  goBooking() {
    this.router.navigate(['/booking', this.bookingId]);
  }
}
