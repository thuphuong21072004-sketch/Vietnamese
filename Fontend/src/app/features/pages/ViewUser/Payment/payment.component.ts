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

  loading = false;

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

  /*
   * load booking detail
   */
  loadBooking() {
    this.bookingService
      .getDetail(this.bookingId)

      .subscribe({
        next: (res) => {
          this.booking = res;
        },

        error: (err) => {
          console.error(err);

          this.booking = null;

          alert(err.error?.message || 'Failed to load booking');
        },
      });
  }

  /*
   * load payment
   */
  loadPayment() {
    this.paymentService
      .getByBooking(this.bookingId)

      .subscribe({
        next: (res) => {
          this.payment = res;

          /*
           * payment success
           */
          if (res && res.status === 1) {
            this.goClassroom();
          }
        },

        error: () => {
          this.payment = null;
        },
      });
  }

  /*
   * calculate payment amount
   */
  getAmount(): number {
    if (!this.booking) {
      return 0;
    }

    const pricePerHour = Number(
      this.booking?.instructor?.teacherProfile?.pricePerHour || 0,
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

  /*
   * booking duration
   */
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

  /*
   * currency format
   */
  formatCurrency(value: number): string {
    return value.toLocaleString('en-US', {
      style: 'currency',

      currency: 'USD',
    });
  }

  /*
   * pay with VNPay
   */
  pay() {
    if (!this.booking) {
      alert('Booking not found');

      return;
    }

    const amount = this.getAmount();

    if (amount <= 0) {
      alert('Invalid payment amount');

      return;
    }

    this.loading = true;

    /*
     * payment success
     */
    if (this.payment && this.payment.status === 1) {
      this.goClassroom();

      return;
    }

    /*
     * already has payment
     * pending or failed
     */
    if (
      this.payment &&
      (this.payment.status === 0 || this.payment.status === 2)
    ) {
      this.paymentService
        .createVNPayUrl(this.payment.paymentId)

        .subscribe({
          next: (vnpayRes) => {
            /*
             * redirect VNPay
             */
            window.location.href = vnpayRes.paymentUrl;
          },

          error: (err) => {
            console.error(err);

            this.loading = false;

            alert(err.error?.message || 'Create VNPay failed');
          },
        });

      return;
    }

    /*
     * create new payment
     */
    const body = {
      bookingId: this.bookingId,

      amount: amount,

      paymentMethod: 0,
    };

    this.paymentService
      .create(body)

      .subscribe({
        next: (res) => {
          this.payment = res;

          /*
           * create VNPay url
           */
          this.paymentService
            .createVNPayUrl(res.paymentId)

            .subscribe({
              next: (vnpayRes) => {
                /*
                 * redirect VNPay
                 */
                window.location.href = vnpayRes.paymentUrl;
              },

              error: (err) => {
                console.error(err);

                this.loading = false;

                alert(err.error?.message || 'Create VNPay failed');
              },
            });
        },

        error: (err) => {
          console.error(err);

          this.loading = false;

          alert(err.error?.message || 'Create payment failed');
        },
      });
  }

  /*
   * helper payment status
   */
  getStatusText(status: number): string {
    return this.paymentService.getStatusText(status);
  }

  /*
   * helper payment css class
   */
  getStatusClass(status: number): string {
    return this.paymentService.getStatusClass(status);
  }

  /*
   * back
   */
  back() {
    history.back();
  }

  /*
   * go booking detail
   */
  goBooking() {
    this.router.navigate(['/booking', this.bookingId]);
  }

  /*
   * go classroom
   */
  goClassroom() {
    this.router.navigate(['/video-room', this.bookingId]);
  }
}
