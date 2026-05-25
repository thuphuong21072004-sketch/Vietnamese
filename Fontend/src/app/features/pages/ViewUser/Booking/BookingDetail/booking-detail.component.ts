import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { BookingService } from '../../../../services/booking.service';
import { PaymentService } from '../../../../services/payment.service';
import { VideoRoomService } from '../../../../services/video-room.service';
import { ReviewService } from '../../../../services/review.service';

@Component({
  selector: 'app-booking-detail',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './booking-detail.component.html',

  styleUrls: ['./booking-detail.component.css'],
})
export class BookingDetailComponent implements OnInit {
  booking: any = null;

  loading = true;

  paymentLoading = false;

  cancelLoading = false;

  payment: any = null;
  room: any = null;
  review: any = null;

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    public bookingService: BookingService,

    private paymentService: PaymentService,
    private roomService: VideoRoomService,
    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.loadBooking(id);
  }

  loadBooking(id: number) {
    this.loading = true;

    this.bookingService.getDetail(id).subscribe({
      next: (res) => {
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

  loadRoom() {
    this.room = null;

    if (!this.booking?.bookingId) return;

    this.roomService.getByBookingId(this.booking.bookingId).subscribe({
      next: (res: any) => {
        this.room = res;
      },
      error: () => {
        this.room = null;
      },
    });
  }

  cancelBooking() {
    if (!confirm('Cancel this booking?')) {
      return;
    }

    this.cancelLoading = true;

    this.bookingService.cancel(this.booking.bookingId).subscribe({
      next: () => {
        this.booking.status = 2;

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

  goPayment() {
    this.router.navigate(['/payment', this.booking.bookingId]);
  }

  joinRoom() {
    if (!this.canJoinRoom()) {
      alert(this.getJoinWindowMessage() || 'Room is not available right now.');
      return;
    }

    // Try to open direct room link if exists
    this.roomService.getByBookingId(this.booking.bookingId).subscribe({
      next: (res: any) => {
        const url = this.getRoomUrlFrom(res);
        if (url) {
          window.open(url, '_blank');
        } else {
          // fallback to room page
          this.router.navigate(['/room', this.booking.bookingId]);
        }
      },
      error: () => {
        this.router.navigate(['/room', this.booking.bookingId]);
      },
    });
  }

  private getRoomUrlFrom(room: any): string | null {
    if (!room) return null;
    if (room.joinUrl) return room.joinUrl;
    if (!room.roomCode) return null;
    if (room.roomCode.startsWith('http')) return room.roomCode;
    const token = room.token ? `?token=${encodeURIComponent(room.token)}` : '';
    return `https://meeting.example.com/${room.roomCode}${token}`;
  }

  writeReview() {
    this.router.navigate(['/review', this.booking.bookingId]);
  }

  back() {
    history.back();
  }

  getStatusText(status: number): string {
    return this.bookingService.getStatusText(status);
  }

  getStatusClass(status: number): string {
    return this.bookingService.getStatusClass(status);
  }

  getTeacherName(): string {
    return this.bookingService.getTeacherName(this.booking);
  }

  getAvatar(): string {
    return this.bookingService.getAvatar(this.booking);
  }

  loadPayment() {
    this.payment = null;

    if (!this.booking?.bookingId) {
      return;
    }

    this.paymentService.getByBooking(this.booking.bookingId).subscribe({
      next: (res) => {
        this.payment = res;
      },
      error: () => {
        this.payment = null;
      },
    });
  }

  loadReview() {
    this.review = null;

    if (!this.booking?.bookingId) return;

    this.reviewService.getByBookingId(this.booking.bookingId).subscribe({
      next: (res) => {
        this.review = res;
      },
      error: () => {
        this.review = null;
      },
    });
  }

  getAmount(): number {
    return this.bookingService.getBookingAmount(this.booking);
  }

  canPay(): boolean {
    return (
      this.booking?.status === 0 &&
      (!this.payment || this.payment.status !== 1)
    );
  }

  canJoinRoom(): boolean {
    if (!this.booking || this.booking.status !== 1 || !this.payment?.status) {
      return false;
    }

    if (this.payment.status !== 1) {
      return false;
    }

    const now = new Date();
    const start = new Date(this.booking.startTime);
    const end = new Date(this.booking.endTime);
    const openAt = new Date(start.getTime() - 30 * 60 * 1000);
    const closeAt = new Date(end.getTime() + 15 * 60 * 1000);

    return now >= openAt && now <= closeAt;
  }

  getJoinWindowMessage(): string {
    if (!this.booking || this.booking.status !== 1) {
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
      return 'Room access has expired 15 minutes after class end.';
    }

    if (!this.payment || this.payment.status !== 1) {
      return 'Complete payment to join the room.';
    }

    return '';
  }

  isJoinWindowExpired(): boolean {
    if (!this.booking) {
      return false;
    }

    const now = new Date();
    const end = new Date(this.booking.endTime);
    const closeAt = new Date(end.getTime() + 15 * 60 * 1000);
    return now > closeAt;
  }
}
