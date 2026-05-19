import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { BookingService } from '../../../../services/booking.service';

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

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    public bookingService: BookingService,
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

        this.loading = false;
      },

      error: (err) => {
        console.error(err);

        alert(err.error?.message || 'Failed to load booking');

        this.loading = false;
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
    this.router.navigate(['/room', this.booking.bookingId]);
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
}
