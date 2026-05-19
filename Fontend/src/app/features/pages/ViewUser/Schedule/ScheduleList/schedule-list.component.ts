import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

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

  selectedDate = '';

  loading = false;

  constructor(
    public scheduleService: TeacherAvailabilityService,

    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules() {
    this.loading = true;

    this.scheduleService.getAvailableSchedules(this.selectedDate).subscribe({
      next: (res) => {
        this.schedules = res;

        this.loading = false;
      },

      error: (err) => {
        console.error(err);

        this.loading = false;
      },
    });
  }

  openDetail(id: number) {
    this.router.navigate(['/schedule', id]);
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
