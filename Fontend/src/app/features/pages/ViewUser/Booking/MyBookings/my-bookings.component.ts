import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { BookingService } from '../../../../services/booking.service';

import { VideoRoomService } from '../../../../services/video-room.service';
import { ReviewService } from '../../../../services/review.service';
@Component({
  selector: 'app-my-bookings',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './my-bookings.component.html',

  styleUrls: ['./my-bookings.component.css'],
})
export class MyBookingsComponent implements OnInit {
  bookings: any[] = [];

  filteredBookings: any[] = [];

  loading = false;

  /*
   * filter
   */
  selectedStatus = '';

  selectedDate = '';
  reviewedBookings = new Set<number>();

  constructor(
    public bookingService: BookingService,

    private router: Router,

    private roomService: VideoRoomService,
    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  /*
   * load bookings
   */
  loadBookings() {
    this.loading = true;

    const status =
      this.selectedStatus !== '' ? Number(this.selectedStatus) : undefined;

    this.bookingService
      .getMyBookings(status, this.selectedDate)

      .subscribe({
        next: (res) => {
          this.bookings = res || [];

          this.filteredBookings = [...this.bookings];
          this.checkReviewedBookings();
          this.loading = false;
        },

        error: (err) => {
          console.error(err);

          this.loading = false;
        },
      });
  }

  /*
   * detail
   */
  openDetail(id: number) {
    this.router.navigate(['/booking', id]);
  }

  /*
   * cancel booking
   */
  cancelBooking(id: number) {
    if (!confirm('Cancel this booking?')) {
      return;
    }

    this.bookingService
      .cancel(id)

      .subscribe({
        next: () => {
          const booking = this.bookings.find((x) => x.bookingId === id);

          /*
           * cancelled
           */
          if (booking) {
            booking.status = 4;
          }

          alert('Booking cancelled successfully');

          this.loadBookings();
        },

        error: (err) => {
          console.error(err);

          alert(err.error?.message || 'Failed to cancel booking');
        },
      });
  }

  /*
   * payment
   */
  goPayment(id: number) {
    this.router.navigate(['/payment', id]);
  }

  /*
   * join room
   */
  joinRoom(id: number) {
    this.roomService
      .getByBookingId(id)

      .subscribe({
        next: (res: any) => {
          const url = this.getRoomUrlFrom(res);

          if (url) {
            window.open(url, '_blank');

            return;
          }

          this.createAndOpenRoom(id);
        },

        error: () => {
          this.createAndOpenRoom(id);
        },
      });
  }

  /*
   * create room
   */
  private createAndOpenRoom(id: number) {
    this.roomService
      .create(id)

      .subscribe({
        next: (res: any) => {
          const url = this.getRoomUrlFrom(res);

          if (url) {
            window.open(url, '_blank');
          } else {
            alert('Room created but link unavailable');

            this.router.navigate(['/room', id]);
          }
        },

        error: (err: any) => {
          console.error(err);

          alert(err.error?.message || 'Failed to create room');
        },
      });
  }

  /*
   * room url
   */
  private getRoomUrlFrom(room: any): string | null {
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

    return `https://meet.jit.si/${room.roomCode}${token}`;
  }

  /*
   * review
   */
  writeReview(id: number) {
    this.router.navigate(['/review', id]);
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
   * can join room
   */
  canJoinRoom(item: any): boolean {
    if (!item) {
      return false;
    }

    /*
     * confirmed hoặc in progress
     */
    if (item.status !== 1 && item.status !== 2) {
      return false;
    }

    const now = new Date();

    const start = new Date(item.startTime);

    const end = new Date(item.endTime);

    /*
     * mở trước 30 phút
     */
    const openAt = new Date(start.getTime() - 30 * 60 * 1000);

    /*
     * đóng sau 15 phút
     */
    const closeAt = new Date(end.getTime() + 15 * 60 * 1000);

    return now >= openAt && now <= closeAt;
  }

  /*
   * past booking
   */
  isPastBooking(item: any): boolean {
    if (!item) {
      return false;
    }

    const now = new Date();

    const end = new Date(item.endTime);

    return now > end;
  }

  /*
   * review button
   */
  showReviewButton(item: any): boolean {
    return item?.status === 3;
  }

  /*
   * can cancel booking
   */
  canCancel(item: any): boolean {
    if (!item) {
      return false;
    }

    /*
     * chỉ pending hoặc confirmed
     */
    if (item.status !== 0 && item.status !== 1) {
      return false;
    }

    const now = new Date();

    const start = new Date(item.startTime);

    /*
     * không hủy sau khi lớp bắt đầu
     */
    return now < start;
  }

  /*
   * teacher name
   */
  getTeacherName(item: any): string {
    return this.bookingService.getTeacherName(item);
  }

  /*
   * avatar
   */
  getAvatar(item: any): string {
    return this.bookingService.getAvatar(item);
  }

  /*
   * duration
   */
  getDurationHours(item: any): number {
    return this.bookingService.getDurationHours(item);
  }
  checkReviewedBookings() {
    this.reviewedBookings.clear();

    this.bookings.forEach((item) => {
      if (item.status !== 3) {
        return;
      }

      this.reviewService.getByBookingId(item.bookingId).subscribe({
        next: (review) => {
          if (review) {
            this.reviewedBookings.add(item.bookingId);
          }
        },
      });
    });
  }

  canReview(item: any): boolean {
    return item?.status === 3 && !this.reviewedBookings.has(item.bookingId);
  }

  hasReviewed(item: any): boolean {
    return this.reviewedBookings.has(item.bookingId);
  }
}
