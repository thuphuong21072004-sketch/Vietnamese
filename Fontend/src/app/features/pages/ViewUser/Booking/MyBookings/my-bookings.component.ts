import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { BookingService } from '../../../../services/booking.service';

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

  getStatusText(status: number): string {
    return this.bookingService.getStatusText(status);
  }

  getStatusClass(status: number): string {
    return this.bookingService.getStatusClass(status);
  }

  getTeacherName(item: any): string {
    return this.bookingService.getTeacherName(item);
  }

  getAvatar(item: any): string {
    return this.bookingService.getAvatar(item);
  }
}
