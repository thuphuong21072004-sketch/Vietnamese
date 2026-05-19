import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { PaymentService } from '../../../services/payment.service';

import { BookingService } from '../../../services/booking.service';

@Component({
  selector: 'app-payment',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './payment.component.html',

  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent implements OnInit {
  bookingId = 0;

  payment: any = null;

  loading = false;

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    public paymentService: PaymentService,

    public bookingService: BookingService,
  ) {}

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.paramMap.get('id'));

    this.loadPayment();
  }

  loadPayment() {
    this.paymentService.getByBooking(this.bookingId).subscribe({
      next: (res) => {
        this.payment = res;
      },

      error: (err) => {
        console.error(err);
      },
    });
  }

  pay() {
    this.loading = true;

    const body = {
      bookingId: this.bookingId,

      amount: 20,

      paymentMethod: 'VNPAY',
    };

    this.paymentService.create(body).subscribe({
      next: (res) => {
        this.paymentService
          .success(res.paymentId, 'TEST_' + Date.now())
          .subscribe({
            next: () => {
              this.loading = false;

              alert('Payment success');

              this.router.navigate(['/booking', this.bookingId]);
            },

            error: (err) => {
              console.error(err);

              this.loading = false;

              alert(err.error?.message || 'Payment failed');
            },
          });
      },

      error: (err) => {
        console.error(err);

        this.loading = false;

        alert(err.error?.message || 'Payment failed');
      },
    });
  }

  paymentFailed() {
    if (!this.payment) {
      return;
    }

    this.loading = true;

    this.paymentService.failed(this.payment.paymentId).subscribe({
      next: () => {
        this.loading = false;

        alert('Payment marked failed');

        this.router.navigate(['/booking', this.bookingId]);
      },

      error: (err) => {
        console.error(err);

        this.loading = false;

        alert(err.error?.message);
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
