import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';
import { VideoRoomService } from '../../../services/video-room.service';

import { BookingService } from '../../../services/booking.service';

@Component({
  selector: 'app-teacher-bookings',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './myclass.component.html',

  styleUrls: ['./myclass.component.css'],
})
export class TeacherBookingsComponent implements OnInit {
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

    this.bookingService.getTeacherBookings().subscribe({
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

  confirmBooking(id: number) {
    if (!confirm('Confirm this booking?')) {
      return;
    }

    this.bookingService.confirm(id).subscribe({
      next: () => {
        const booking = this.bookings.find((x) => x.bookingId === id);

        if (booking) {
          booking.status = 1;
        }

        alert('Booking confirmed successfully');
      },

      error: (err) => {
        console.error(err);

        alert(err.error?.message || 'Failed to confirm booking');
      },
    });
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

  canComplete(item: any): boolean {
    if (!item || item.status !== 1) {
      return false;
    }

    const now = new Date();
    const end = new Date(item.endTime);
    return now >= end;
  }

  getStudentName(item: any): string {
    return this.bookingService.getStudentName(item);
  }

  getAvatar(item: any): string {
    return this.bookingService.getAvatar(item);
  }
}
