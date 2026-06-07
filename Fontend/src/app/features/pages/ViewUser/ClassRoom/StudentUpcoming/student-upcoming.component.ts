import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ClassEnrollmentService } from '../../../../services/class-enrollment.service';

import { UpcomingScheduleDto } from '../../../../models/upcoming-schedule.model';

@Component({
  selector: 'app-student-upcoming',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-upcoming.component.html',
  styleUrls: ['./student-upcoming.component.css'],
})
export class StudentScheduleComponent implements OnInit {
  loading = false;

  schedules: UpcomingScheduleDto[] = [];

  constructor(private enrollmentService: ClassEnrollmentService) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    this.loading = true;

    this.enrollmentService.getStudentUpcomingSchedule().subscribe({
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
