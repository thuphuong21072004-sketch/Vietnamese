import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { BookingService } from '../../../../services/booking.service';
import { VideoRoomService } from '../../../../services/video-room.service';

@Component({
  selector: 'app-my-bookings',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './my-bookings.component.html',

  styleUrls: ['./my-bookings.component.css'],
})
export class MyBookingsComponent implements OnInit {
  bookings: any[] = [];

  loading = false;

  constructor(
    public bookingService: BookingService,

    private router: Router,
    private roomService: VideoRoomService,
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings() {
    this.loading = true;

    this.bookingService.getMyBookings().subscribe({
      next: (res) => {
        this.bookings = res;

        this.loading = false;
      },

      error: (err) => {
        console.error(err);

        this.loading = false;
      },
    });
  }

  openDetail(id: number) {
    this.router.navigate(['/booking', id]);
  }

  cancelBooking(id: number) {
    if (!confirm('Cancel this booking?')) {
      return;
    }

    this.bookingService.cancel(id).subscribe({
      next: () => {
        const booking = this.bookings.find((x) => x.bookingId === id);

        if (booking) {
          booking.status = 2;
        }

        alert('Booking cancelled successfully');
      },

      error: (err) => {
        console.error(err);

        alert(err.error?.message || 'Failed to cancel booking');
      },
    });
  }

  goPayment(id: number) {
    this.router.navigate(['/payment', id]);
  }

  joinRoom(id: number) {
    // Try to open existing room; if not present, create then open
    this.roomService.getByBookingId(id).subscribe({
      next: (res: any) => {
        const url = this.getRoomUrlFrom(res);
        if (url) {
          window.open(url, '_blank');
          return;
        }

        // if room returned but no URL, attempt creation
        this.createAndOpenRoom(id);
      },
      error: (err: any) => {
        // not found or error -> create then open
        this.createAndOpenRoom(id);
      },
    });
  }

  private createAndOpenRoom(id: number) {
    this.roomService.create(id).subscribe({
      next: (res: any) => {
        const url = this.getRoomUrlFrom(res);
        if (url) {
          window.open(url, '_blank');
        } else {
          alert('Room created but link is unavailable. Open room page to manage.');
          this.router.navigate(['/room', id]);
        }
      },
      error: (err: any) => {
        console.error(err);
        alert(err.error?.message || 'Failed to create/open room');
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

  writeReview(id: number) {
    this.router.navigate(['/review', id]);
  }

  getStatusText(status: number): string {
    return this.bookingService.getStatusText(status);
  }

  getStatusClass(status: number): string {
    return this.bookingService.getStatusClass(status);
  }

  canJoinRoom(item: any): boolean {
    if (!item || item.status !== 1) {
      return false;
    }

    const now = new Date();
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    const openAt = new Date(start.getTime() - 30 * 60 * 1000);
    const closeAt = new Date(end.getTime() + 15 * 60 * 1000);

    return now >= openAt && now <= closeAt;
  }

  isPastBooking(item: any): boolean {
    if (!item || item.status !== 1) {
      return false;
    }

    const now = new Date();
    const end = new Date(item.endTime);
    return now > end;
  }

  showReviewButton(item: any): boolean {
    return item?.status === 3 || this.isPastBooking(item);
  }

  getTeacherName(item: any): string {
    return this.bookingService.getTeacherName(item);
  }

  getAvatar(item: any): string {
    return this.bookingService.getAvatar(item);
  }
}
