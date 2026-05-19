import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

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

  completeBooking(id: number) {
    if (!confirm('Complete this booking?')) {
      return;
    }

    this.bookingService.complete(id).subscribe({
      next: () => {
        const booking = this.bookings.find((x) => x.bookingId === id);

        if (booking) {
          booking.status = 3;
        }

        alert('Booking completed successfully');
      },

      error: (err) => {
        console.error(err);

        alert(err.error?.message || 'Failed to complete booking');
      },
    });
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

  getStudentName(item: any): string {
    return this.bookingService.getStudentName(item);
  }

  getAvatar(item: any): string {
    return this.bookingService.getAvatar(item);
  }
}
