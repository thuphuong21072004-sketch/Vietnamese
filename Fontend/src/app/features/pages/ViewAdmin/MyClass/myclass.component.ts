import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { VideoRoomService } from '../../../services/video-room.service';

import { BookingService } from '../../../services/booking.service';
import { ReviewService } from '../../../services/review.service';
@Component({
  selector: 'app-teacher-bookings',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './myclass.component.html',

  styleUrls: ['./myclass.component.css'],
})
export class TeacherBookingsComponent implements OnInit {
  bookings: any[] = [];

  filteredBookings: any[] = [];

  loading = false;

  selectedDate = '';

  selectedStatus = '';
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

  loadBookings() {
    this.loading = true;

    const status =
      this.selectedStatus !== '' ? Number(this.selectedStatus) : undefined;

    this.bookingService
      .getTeacherBookings(status, this.selectedDate)

      .subscribe({
        next: (res) => {
          console.log(res);
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

  openDetail(id: number) {
    this.router.navigate(['/admin/bookings', id]);
  }

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

  private createAndOpenRoom(id: number) {
    this.roomService
      .create(id)

      .subscribe({
        next: (res: any) => {
          const url = this.getRoomUrlFrom(res);

          if (url) {
            window.open(url, '_blank');
          } else {
            alert('Room created but no link found');
          }
        },

        error: (err: any) => {
          console.error(err);

          alert(err.error?.message || 'Failed to open room');
        },
      });
  }

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

    return `https://meeting.example.com/${room.roomCode}${token}`;
  }

  cancelBooking(id: number) {
    if (!confirm('Cancel this booking?')) {
      return;
    }

    this.bookingService
      .cancel(id)

      .subscribe({
        next: () => {
          const booking = this.bookings.find((x) => x.bookingId === id);

          if (booking) {
            booking.status = 4;
          }

          this.loadBookings();

          alert('Booking cancelled successfully');
        },

        error: (err) => {
          console.error(err);

          alert(err.error?.message || 'Failed to cancel booking');
        },
      });
  }

  getStatusText(status: number): string {
    return this.bookingService.getStatusText(status);
  }

  getStatusClass(status: number): string {
    return this.bookingService.getStatusClass(status);
  }

  /*
   * can join room
   */
  canJoinRoom(item: any): boolean {
    if (!item || item.status !== 2) {
      return false;
    }

    const now = new Date();

    const start = new Date(item.startTime);

    const end = new Date(item.endTime);

    const openAt = new Date(start.getTime() - 30 * 60 * 1000);

    const closeAt = new Date(end.getTime() + 15 * 60 * 1000);

    return now >= openAt && now <= closeAt;
  }

  /*
   * waiting room
   */
  isWaitingRoom(item: any): boolean {
    if (!item || item.status !== 1) {
      return false;
    }

    const now = new Date();

    const start = new Date(item.startTime);

    return now < start;
  }

  /*
   * can view review
   */
  canViewReview(item: any): boolean {
    return this.reviewedBookings.has(item.bookingId);
  }

  getStudentName(item: any): string {
    return this.bookingService.getStudentName(item);
  }

  getAvatar(item: any): string {
    return this.bookingService.getAvatar(item);
  }


  getDurationHours(item: any): number {
    return this.bookingService.getDurationHours(item);
  }

  /*
   * class ended
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
   * can cancel
   */
  canCancel(item: any): boolean {
    if (!item) {
      return false;
    }

    /*
     * pending payment
     */
    if (item.status === 0) {
      return true;
    }

    /*
     * confirmed
     */
    if (item.status === 1) {
      const now = new Date();

      const start = new Date(item.startTime);

      return now < start;
    }

    return false;
  }
  getStudentAvatar(item: any): string {
    const avatar = item?.student?.avatarUrl;

    if (!avatar) {
      return '';
    }

    if (avatar.startsWith('http')) {
      return avatar;
    }

    return `http://localhost:5108/uploads/${avatar}`;
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
}
