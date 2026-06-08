import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { BookingService } from '../../../../services/booking.service';

import { PaymentService } from '../../../../services/payment.service';

import { VideoRoomService } from '../../../../services/video-room.service';

import { ReviewService } from '../../../../services/review.service';
import { PaymentDTO } from '../../../../models/payment.model';
@Component({
  selector: 'app-booking-detail',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './booking-detail.component.html',

  styleUrls: ['./booking-detail.component.css'],
})
export class BookingDetailComponent implements OnInit {
  booking: any = null;

  payment: any = null;

  room: any = null;

  review: any = null;

  loading = true;

  paymentLoading = false;

  cancelLoading = false;

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    public bookingService: BookingService,

    public paymentService: PaymentService,

    private roomService: VideoRoomService,

    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.loadBooking(id);
  }

  /*
   * load booking
   */
  loadBooking(id: number) {
    this.loading = true;

    this.bookingService
      .getDetail(id)

      .subscribe({
        next: (res: PaymentDTO | null) => {
          this.booking = res;

          this.loadPayment();

          this.loadRoom();

          this.loadReview();

          this.loading = false;
        },

        error: (err) => {
          console.error(err);

          alert(err.error?.message || 'Failed to load booking');

          this.loading = false;
        },
      });
  }

  /*
   * load payment
   */
  loadPayment() {
    this.payment = null;

    if (!this.booking?.bookingId) {
      return;
    }

    this.paymentService
      .getByRef('PrivateLesson', this.booking.bookingId)

      .subscribe({
        next: (res) => {
          this.payment = res;
        },

        error: () => {
          this.payment = null;
        },
      });
  }

  /*
   * load room
   */
  loadRoom() {
    this.room = null;

    if (!this.booking?.bookingId) {
      return;
    }

    this.roomService
      .join('PrivateLesson', this.booking.bookingId)

      .subscribe({
        next: (res: any) => {
          this.room = res;
        },

        error: () => {
          this.room = null;
        },
      });
  }

  /*
   * load review
   */
  loadReview() {
    this.review = null;

    if (!this.booking?.bookingId) {
      return;
    }

    this.reviewService
      .getByBookingId(this.booking.bookingId)

      .subscribe({
        next: (res) => {
          this.review = res;
        },

        error: () => {
          this.review = null;
        },
      });
  }

  /*
   * cancel booking
   */
  cancelBooking() {
    if (!confirm('Cancel this booking?')) {
      return;
    }

    this.cancelLoading = true;

    this.bookingService
      .cancel(this.booking.bookingId)

      .subscribe({
        next: () => {
          /*
           * cancelled
           */
          this.booking.status = 4;

          this.cancelLoading = false;

          alert('Booking cancelled successfully');
        },

        error: (err) => {
          console.error(err);

          this.cancelLoading = false;

          alert(err.error?.message || 'Failed to cancel booking');
        },
      });
  }

  /*
   * payment page
   */
  goPayment() {
    this.router.navigate(['/payment', this.booking.bookingId]);
  }

  /*
   * join room
   */
  joinRoom() {
    if (!this.canJoinRoom()) {
      alert(this.getJoinWindowMessage() || 'Room is not available right now.');

      return;
    }

    this.roomService
      .join('PrivateLesson', this.booking.bookingId)

      .subscribe({
        next: (res: any) => {
          const url = res?.joinUrl;

          if (url) {
            window.open(url, '_blank');
          } else {
            this.router.navigate(['/room', this.booking.bookingId]);
          }
        },

        error: () => {
          this.router.navigate(['/room', this.booking.bookingId]);
        },
      });
  }


  /*
   * review
   */
  writeReview() {
    this.router.navigate(['/review', this.booking.bookingId]);
  }

  /*
   * back
   */
  back() {
    history.back();
  }

  /*
   * status text
   */
  getStatusText(status: number): string {
    return this.bookingService.getStatusText(status);
  }

  /*
   * status class
   */
  getStatusClass(status: number): string {
    return this.bookingService.getStatusClass(status);
  }

  /*
   * teacher name
   */
  getTeacherName(): string {
    return this.bookingService.getTeacherName(this.booking);
  }

  /*
   * avatar
   */
  getAvatar(): string {
    return this.bookingService.getAvatar(this.booking);
  }

  /*
   * can pay
   */
  canPay(): boolean {
    return (
      this.booking?.status === 0 && (!this.payment || this.payment.status !== 1)
    );
  }

  /*
   * can join room
   */
  canJoinRoom(): boolean {
    if (!this.booking || this.booking.status !== 2) {
      return false;
    }

    if (!this.payment || this.payment.status !== 1) {
      return false;
    }

    const now = new Date();

    const start = new Date(this.booking.startTime);

    const end = new Date(this.booking.endTime);

    /*
     * open before 30 mins
     */
    const openAt = new Date(start.getTime() - 30 * 60 * 1000);

    /*
     * close after 15 mins
     */
    const closeAt = new Date(end.getTime() + 15 * 60 * 1000);

    return now >= openAt && now <= closeAt;
  }

  /*
   * join room message
   */
  getJoinWindowMessage(): string {
    if (!this.booking || this.booking.status !== 2) {
      return '';
    }

    const now = new Date();

    const start = new Date(this.booking.startTime);

    const end = new Date(this.booking.endTime);

    const openAt = new Date(start.getTime() - 30 * 60 * 1000);

    const closeAt = new Date(end.getTime() + 15 * 60 * 1000);

    if (now < openAt) {
      return 'Room opens 30 minutes before class start.';
    }

    if (now > closeAt) {
      return 'Room access has expired.';
    }

    return '';
  }

  /*
   * expired
   */
  isJoinWindowExpired(): boolean {
    if (!this.booking) {
      return false;
    }

    const now = new Date();

    const end = new Date(this.booking.endTime);

    const closeAt = new Date(end.getTime() + 15 * 60 * 1000);

    return now > closeAt;
  }

  /*
   * class ended
   */
  isClassCompleted(): boolean {
    if (!this.booking) {
      return false;
    }

    const now = new Date();

    const end = new Date(this.booking.endTime);

    return now > end;
  }

  /*
   * can review
   */
  canReview(): boolean {
    if (!this.booking) {
      return false;
    }

    /*
     * completed only
     */
    if (this.booking.status !== 3) {
      return false;
    }

    /*
     * payment success
     */
    if (this.payment && this.payment.status !== 1) {
      return false;
    }

    /*
     * already reviewed
     */
    if (this.review) {
      return false;
    }

    return true;
  }

  /*
   * reviewed
   */
  isReviewed(): boolean {
    if (!this.booking) {
      return false;
    }

    return this.booking.status === 3 && !!this.review;
  }

  /*
   * can cancel
   */
  canCancel(): boolean {
    if (!this.booking) {
      return false;
    }

    /*
     * pending payment
     */
    if (this.booking.status === 0) {
      return true;
    }

    /*
     * confirmed
     */
    if (this.booking.status === 1) {
      const now = new Date();

      const start = new Date(this.booking.startTime);

      return now < start;
    }

    return false;
  }
}
