import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { BookingService } from '../../../../services/booking.service';

import { TeacherAvailabilityService } from '../../../../services/teacher-availability.service';

import { PaymentService } from '../../../../services/payment.service';

@Component({
  selector: 'app-teacher-schedules',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './schedule-list.component.html',

  styleUrls: ['./schedule-list.component.css'],
})
export class TeacherSchedulesComponent implements OnInit {
  schedules: any[] = [];

  visibleSchedules: any[] = [];

  keyword = '';

  selectedDate = '';

  loading = false;

  constructor(
    public scheduleService: TeacherAvailabilityService,

    private bookingService: BookingService,

    private paymentService: PaymentService,

    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  /*
   * load schedules
   */
  loadSchedules() {
    this.loading = true;

    this.scheduleService
      .getAvailableSchedules(this.selectedDate)

      .subscribe({
        next: (res) => {
          const now = new Date();

          this.schedules = (res || []).filter(
            (item) => item.status === 0 && new Date(item.startTime) > now,
          );

          this.visibleSchedules = [...this.schedules];

          if (this.keyword.trim()) {
            this.searchSchedules();
          }

          this.loading = false;
        },

        error: (err) => {
          console.error(err);

          this.loading = false;
        },
      });
  }

  /*
   * search
   */
  searchSchedules() {
    const search = this.keyword.trim().toLowerCase();

    if (!search) {
      this.visibleSchedules = [...this.schedules];

      return;
    }

    this.visibleSchedules = this.schedules.filter((item) => {
      const name = this.getTeacherName(item).toLowerCase();

      const specialty = this.getSpecialty(item).toLowerCase();

      const date = item.startTime
        ? new Date(item.startTime).toLocaleDateString().toLowerCase()
        : '';

      return (
        name.includes(search) ||
        specialty.includes(search) ||
        date.includes(search)
      );
    });
  }

  /*
   * detail
   */
  openDetail(id: number) {
    this.router.navigate(['/schedule', id]);
  }


  bookSchedule(item: any) {
    if (item.status !== 0) {
      return;
    }

    
    this.bookingService
      .create(item.availabilityId)

      .subscribe({
        next: (bookingRes) => {
          
          const start = new Date(item.startTime);

          const end = new Date(item.endTime);

          const hours =
            Math.max(0, end.getTime() - start.getTime()) / (1000 * 60 * 60);

          const amount =
            Math.round(
              ((item?.instructorProfile?.pricePerHour || 0) * hours +
                Number.EPSILON) *
                100,
            ) / 100;

          const body = {
            bookingId: bookingRes.bookingId,

            amount: amount,

            paymentMethod: 0,
          };

          this.paymentService
            .create(body)

            .subscribe({
              next: (paymentRes) => {
                
                this.paymentService
                  .createVNPayUrl(paymentRes.paymentId)

                  .subscribe({
                    next: (vnpayRes) => {
                      
                      window.location.href = vnpayRes.paymentUrl;
                    },

                    error: (err) => {
                      console.error(err);

                      alert(err.error?.message || 'VNPay failed');
                    },
                  });
              },

              error: (err) => {
                console.error(err);

                alert(err.error?.message || 'Create payment failed');
              },
            });
        },

        error: (err) => {
          console.error(err);

          alert(err.error?.message || 'Booking failed');
        },
      });
  }

  /*
   * teacher name
   */
  getTeacherName(item: any): string {
    return this.scheduleService.getTeacherName(item);
  }

  /*
   * avatar
   */
  getTeacherAvatar(item: any): string {
    return this.scheduleService.getTeacherAvatar(item);
  }

  /*
   * specialty
   */
  getSpecialty(item: any): string {
    return this.scheduleService.getSpecialty(item);
  }

  /*
   * price
   */
  getPricePerHour(item: any): number {
    return this.scheduleService.getPricePerHour(item);
  }

  /*
   * rating
   */
  getRating(item: any): number {
    return this.scheduleService.getRating(item);
  }

  /*
   * reviews
   */
  getTotalReviews(item: any): number {
    return this.scheduleService.getTotalReviews(item);
  }
}
