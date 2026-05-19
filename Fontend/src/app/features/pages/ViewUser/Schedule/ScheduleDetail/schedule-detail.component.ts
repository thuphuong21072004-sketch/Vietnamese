import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { TeacherAvailabilityService } from '../../../../services/teacher-availability.service';

import { BookingService } from '../../../../services/booking.service';

@Component({
  selector: 'app-schedule-detail',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './schedule-detail.component.html',

  styleUrls: ['./schedule-detail.component.css'],
})
export class ScheduleDetailComponent implements OnInit {
  loading = true;

  bookingLoading = false;

  schedule: any = null;

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    public scheduleService: TeacherAvailabilityService,

    private bookingService: BookingService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.loadDetail(id);
  }

  loadDetail(id: number) {
    this.loading = true;

    this.scheduleService.getDetail(id).subscribe({
      next: (res) => {
        this.schedule = res;

        this.loading = false;
      },

      error: (err) => {
        console.error(err);

        alert(err.error?.message || 'Failed to load schedule');

        this.loading = false;
      },
    });
  }

  bookSchedule() {
    if (this.schedule?.isBooked) {
      return;
    }

    this.bookingLoading = true;

    this.bookingService.create(this.schedule.availabilityId).subscribe({
      next: (res) => {
        this.bookingLoading = false;

        alert('Booking created successfully');

        this.router.navigate(['/booking', res.bookingId]);
      },

      error: (err) => {
        console.error(err);

        this.bookingLoading = false;

        alert(err.error?.message || 'Booking failed');
      },
    });
  }

  back() {
    history.back();
  }

  getTeacherName(): string {
    return this.scheduleService.getTeacherName(this.schedule);
  }

  getTeacherAvatar(): string {
    return this.scheduleService.getTeacherAvatar(this.schedule);
  }

  getSpecialty(): string {
    return this.scheduleService.getSpecialty(this.schedule);
  }

  getPricePerHour(): number {
    return this.scheduleService.getPricePerHour(this.schedule);
  }

  getRating(): number {
    return this.scheduleService.getRating(this.schedule);
  }

  getTotalReviews(): number {
    return this.scheduleService.getTotalReviews(this.schedule);
  }
}
