import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ClassEnrollmentService } from '../../../../services/class-enrollment.service';

import { UpcomingScheduleDto } from '../../../../models/upcoming-schedule.model';

@Component({
  selector: 'app-teacher-schedule',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-schedule.component.html',
  styleUrls: ['./teacher-schedule.component.css'],
})
export class TeacherUpcomingComponent implements OnInit {
  loading = false;

  schedules: UpcomingScheduleDto[] = [];

  constructor(private enrollmentService: ClassEnrollmentService) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    this.loading = true;

    this.enrollmentService.getTeacherUpcomingSchedule().subscribe({
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
}
