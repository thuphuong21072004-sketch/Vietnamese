import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { PaymentService } from '../../../services/payment.service';

import { BookingService } from '../../../services/booking.service';

import { ClassEnrollmentService } from '../../../services/class-enrollment.service';

@Component({
  selector: 'app-payment',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './payment.component.html',

  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent implements OnInit {
  refId = 0;

  refName = 'PrivateLesson';

  bankInfo: any = null;
  selectedMethod: 'stripe' | 'bank' = 'stripe';

  booking: any = null;

  enrollment: any = null;

  payment: any = null;

  selectedCurrency = 'USD';

  loading = false;

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    public paymentService: PaymentService,

    public bookingService: BookingService,

    public classEnrollmentService: ClassEnrollmentService,
  ) {}

  ngOnInit(): void {
    this.refId = Number(this.route.snapshot.paramMap.get('id'));

    this.refName =
      this.route.snapshot.queryParamMap.get('type') || 'PrivateLesson';

    if (this.refName === 'PrivateLesson') {
      this.loadBooking();
    }

    if (this.refName === 'CLASS') {
      this.loadEnrollment();
    }

    this.loadPayment();
  }

  loadPayment() {
    this.paymentService.getByRef(this.refName, this.refId).subscribe({
      next: (res) => {
        this.payment = res;
      },

      error: () => {
        this.payment = null;
      },
    });
  }

  loadBooking() {
    this.bookingService.getDetail(this.refId).subscribe({
      next: (res) => {
        this.booking = res;
        this.loadBankInfo();
      },

      error: (err) => {
        console.error(err);

        this.booking = null;

        alert(err.error?.message || 'Failed to load booking');
      },
    });
  }

  loadEnrollment() {
    this.classEnrollmentService.getDetail(this.refId).subscribe({
      next: (res: any) => {
        this.enrollment = res;
        this.loadBankInfo();
      },

      error: (err: any) => {
        console.error(err);

        this.enrollment = null;

        alert(err.error?.message || 'Failed to load enrollment');
      },
    });
  }

  confirmPayment() {
    this.loading = true;

    if (
      this.payment &&
      (this.payment.status === 0 || this.payment.status === 2)
    ) {
      this.paymentService
        .createStripeUrl(this.payment.paymentId, this.selectedCurrency)
        .subscribe({
          next: (stripeRes) => {
            window.location.href = stripeRes.paymentUrl;
          },

          error: (err) => {
            console.error(err);

            alert(err.error?.message || 'Payment failed');

            this.loading = false;
          },
        });

      return;
    }

    const body = {
      refName: this.refName,

      refId: this.refId,

      amount: this.getAmount(),

      paymentMethod: 0,
    };

    this.paymentService.create(body as any).subscribe({
      next: (res) => {
        this.payment = res;

        this.paymentService
          .createStripeUrl(res.paymentId, this.selectedCurrency)
          .subscribe({
            next: (stripeRes) => {
              window.location.href = stripeRes.paymentUrl;
            },

            error: (err: any) => {
              console.error(err);

              console.log(err.error);

              alert(err.error?.message || JSON.stringify(err.error));

              this.loading = false;
            },
          });
      },

      error: (err: any) => {
        console.error('FULL ERROR', err);

        console.log('ERROR BODY', err.error);

        alert(err.error?.message || JSON.stringify(err.error));

        this.loading = false;
      },
    });
  }

  getAmount(): number {
    if (this.refName === 'PrivateLesson' && this.booking) {
      const pricePerHour = Number(
        this.booking?.instructor?.teacherProfile?.approvedPricePerHour || 0,
      );

      const start = new Date(this.booking.startTime);

      const end = new Date(this.booking.endTime);

      const durationHours = Math.max(
        0.5,
        (end.getTime() - start.getTime()) / (1000 * 60 * 60),
      );

      return (
        Math.round((pricePerHour * durationHours + Number.EPSILON) * 100) / 100
      );
    }

    if (this.refName === 'CLASS' && this.enrollment) {
      return Number(this.enrollment?.teacherClass?.price || 0);
    }

    return 0;
  }

  getPricePerHour(): number {
    if (!this.booking) {
      return 0;
    }

    return Number(
      this.booking?.instructor?.teacherProfile?.approvedPricePerHour || 0,
    );
  }

  getDuration(): string {
    if (!this.booking) {
      return '-';
    }

    const start = new Date(this.booking.startTime);

    const end = new Date(this.booking.endTime);

    const totalMinutes = Math.max(
      30,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60)),
    );

    const hours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    if (hours <= 0) {
      return `${minutes}m`;
    }

    if (minutes <= 0) {
      return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-US', {
      style: 'currency',

      currency: 'USD',
    });
  }

  pay() {
    const amount = this.getAmount();

    if (amount <= 0) {
      alert('Invalid payment amount');

      return;
    }

    if (this.payment && this.payment.status === 1) {
      return;
    }

    this.confirmPayment();
  }

  loadBankInfo(): void {
    const amount = this.getAmount();
    this.paymentService.getBankInfo(amount).subscribe({
      next: (res) => { this.bankInfo = res; },
      error: () => {},
    });
  }

  getQrUrl(): string {
    if (!this.bankInfo) return '';
    const amountVnd = Math.round(this.bankInfo.vndAmount || 0);
    const info = encodeURIComponent(`${this.bankInfo.note} #${this.refId}`);
    const name = encodeURIComponent(this.bankInfo.accountName);
    return `https://img.vietqr.io/image/${this.bankInfo.bankId}-${this.bankInfo.accountNo}-compact2.png?amount=${amountVnd}&accountName=${name}&addInfo=${info}`;
  }

  submitBankTransfer(): void {
    this.loading = true;
    this.paymentService.bankTransfer({
      refName: this.refName,
      refId: this.refId,
      amount: this.getAmount(),
      paymentMethod: 1,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.goClassroom();
      },
      error: (err: any) => {
        alert(err.error?.message || 'Failed');
        this.loading = false;
      },
    });
  }

  isBankTransferPending(): boolean {
    return this.payment?.paymentMethod === 1 && this.payment?.status === 0;
  }

  showBankTransferForm(): boolean {
    return !!this.bankInfo && !this.isBankTransferPending() && this.payment?.status !== 1;
  }

  back() {
    history.back();
  }

  goClassroom() {
    if (this.refName === 'PrivateLesson') {
      this.router.navigate(['/my-bookings']);

      return;
    }

    if (this.refName === 'CLASS') {
      this.router.navigate(['/user/myclass']);
    }
  }
}
