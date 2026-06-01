import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { BookingService } from '../../../services/booking.service';

import { VideoRoomService } from '../../../services/video-room.service';

import { PaymentService } from '../../../services/payment.service';

import { ReviewService } from '../../../services/review.service';

@Component({
  selector: 'app-teacher-booking-detail',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './mybooking.component.html',

  styleUrls: ['./mybooking.component.css'],
})
export class TeacherBookingDetailComponent implements OnInit {
  loading = true;

  booking: any = null;

  payment: any = null;

  review: any = null;

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

    this.loadDetail(id);
  }

  /*
   * load detail
   */
  loadDetail(id: number) {
    this.loading = true;

    this.bookingService
      .getDetail(id)

      .subscribe({
        next: (res) => {
          this.booking = res;

          this.loadPayment();

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
   * payment
   */
  loadPayment() {
    if (!this.booking?.bookingId) {
      return;
    }

    this.paymentService
      .getByBooking(this.booking.bookingId)

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
   * load review
   */
  loadReview() {
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
   * back
   */
  back() {
    history.back();
  }

  /*
   * student name
   */
  getStudentName(): string {
    return this.bookingService.getStudentName(this.booking);
  }

  /*
   * avatar
   */
  getAvatar(): string {
    const avatar = this.booking?.student?.avatarUrl;

    if (!avatar) {
      return '';
    }

    if (avatar.startsWith('http')) {
      return avatar;
    }

    return `http://localhost:5108/uploads/${avatar}`;
  }

  /*
   * status text
   */
  getStatusText(): string {
    return this.bookingService.getStatusText(this.booking?.status);
  }

  /*
   * status class
   */
  getStatusClass(): string {
    return this.bookingService.getStatusClass(this.booking?.status);
  }

  /*
   * duration
   */
  getDurationHours(): number {
    return this.bookingService.getDurationHours(this.booking);
  }

  /*
   * total amount
   */
  getBookingAmount(): number {
    return this.bookingService.getBookingAmount(this.booking);
  }

  /*
   * can join room
   */
  canJoinRoom(): boolean {
    if (!this.booking || this.booking.status !== 2) {
      return false;
    }

    /*
     * payment success
     */
    if (this.payment && this.payment.status !== 1) {
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
   * waiting room
   */
  isWaitingRoom(): boolean {
    if (!this.booking || this.booking.status !== 1) {
      return false;
    }

    const now = new Date();

    const start = new Date(this.booking.startTime);

    return now < start;
  }

  /*
   * join room
   */
  joinRoom() {
    if (!this.booking) {
      return;
    }

    this.roomService
      .getByBookingId(this.booking.bookingId)

      .subscribe({
        next: (res: any) => {
          const url = this.getRoomUrl(res);

          if (url) {
            window.open(url, '_blank');

            return;
          }

          this.createAndOpenRoom();
        },

        error: () => {
          this.createAndOpenRoom();
        },
      });
  }

  /*
   * create room
   */
  private createAndOpenRoom() {
    this.roomService
      .create(this.booking.bookingId)

      .subscribe({
        next: (res: any) => {
          const url = this.getRoomUrl(res);

          if (url) {
            window.open(url, '_blank');
          } else {
            alert('Room created but no URL found');
          }
        },

        error: (err) => {
          console.error(err);

          alert(err.error?.message || 'Failed to create room');
        },
      });
  }

  /*
   * room url
   */
  private getRoomUrl(room: any): string | null {
    if (!room) {
      return null;
    }

    if (room.joinUrl) {
      return room.joinUrl;
    }

    if (!room.roomCode) {
      return null;
    }

    if (room.roomCode.startsWith('http')) {
      return room.roomCode;
    }

    const token = room.token ? `?token=${encodeURIComponent(room.token)}` : '';

    return `https://meeting.example.com/${room.roomCode}${token}`;
  }

  /*
   * cancel booking
   */
  cancelBooking() {
    if (!confirm('Cancel this booking?')) {
      return;
    }

    this.bookingService
      .cancel(this.booking.bookingId)

      .subscribe({
        next: () => {
          /*
           * cancelled
           */
          this.booking.status = 4;

          alert('Booking cancelled successfully');
        },

        error: (err) => {
          console.error(err);

          alert(err.error?.message || 'Failed to cancel booking');
        },
      });
  }

  /*
   * reviewed
   */
  hasReview(): boolean {
    return !!this.review && !!this.review.comment;
  }

  /*
   * no review
   */
  hasNoReview(): boolean {
    if (!this.booking) {
      return false;
    }

    return this.booking.status === 3 && !this.hasReview();
  }

  /*
   * class ended
   */
  isPastBooking(): boolean {
    if (!this.booking) {
      return false;
    }

    const now = new Date();

    const end = new Date(this.booking.endTime);

    return now > end;
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

  /*
   * has actions
   */
  hasActions(): boolean {
    return this.canJoinRoom() || this.isWaitingRoom() || this.canCancel();
  }
}
