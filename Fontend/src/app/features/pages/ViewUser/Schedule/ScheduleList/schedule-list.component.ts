import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { BookingService } from '../../../../services/booking.service';

import { TeacherAvailabilityService } from '../../../../services/teacher-availability.service';

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

    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules() {
    this.loading = true;

    this.scheduleService.getAvailableSchedules(this.selectedDate).subscribe({
      next: (res) => {
        this.schedules = res.filter((item) => !item.isBooked);

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

  searchSchedules() {
    const search = this.keyword.trim().toLowerCase();

    if (!search) {
      this.visibleSchedules = [...this.schedules];
      return;
    }

    this.visibleSchedules = this.schedules.filter((item) => {
      const name = this.scheduleService.getTeacherName(item).toLowerCase();
      const specialty = this.scheduleService.getSpecialty(item).toLowerCase();
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

  openDetail(id: number) {
    this.router.navigate(['/schedule', id]);
  }

  bookSchedule(item: any) {
    if (item.isBooked) {
      return;
    }

    this.bookingService.create(item.availabilityId).subscribe({
      next: (res) => {
        alert('Booking created successfully');

        this.router.navigate(['/payment', res.bookingId]);
      },
      error: (err) => {
        console.error(err);

        alert(err.error?.message || 'Booking failed');
      },
    });
  }

  getTeacherName(item: any): string {
    return this.scheduleService.getTeacherName(item);
  }

  getTeacherAvatar(item: any): string {
    return this.scheduleService.getTeacherAvatar(item);
  }

  getSpecialty(item: any): string {
    return this.scheduleService.getSpecialty(item);
  }

  getPricePerHour(item: any): number {
    return this.scheduleService.getPricePerHour(item);
  }

  getRating(item: any): number {
    return this.scheduleService.getRating(item);
  }

  getTotalReviews(item: any): number {
    return this.scheduleService.getTotalReviews(item);
  }
}
