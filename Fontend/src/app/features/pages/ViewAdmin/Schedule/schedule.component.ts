import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { TeacherAvailabilityService } from '../../../services/teacher-availability.service';

@Component({
  selector: 'app-teacher-schedule',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './schedule.component.html',

  styleUrls: ['./schedule.component.css'],
})
export class TeacherScheduleComponent implements OnInit {
  schedules: any[] = [];

  loading = false;

  form: any = {
    startTime: '',
    endTime: '',
  };

  editingId: number | null = null;

  constructor(private scheduleService: TeacherAvailabilityService) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules() {
    this.loading = true;

    this.scheduleService.getMySchedules().subscribe({
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

  saveSchedule() {
    if (!this.form.startTime || !this.form.endTime) {
      alert('Please select time');

      return;
    }

    const request = this.editingId
      ? this.scheduleService.update(this.editingId, this.form)
      : this.scheduleService.create(this.form);

    request.subscribe({
      next: () => {
        alert(this.editingId ? 'Schedule updated' : 'Schedule created');

        this.resetForm();

        this.loadSchedules();
      },

      error: (err) => {
        console.error(err);

        alert(err.error?.message || 'Operation failed');
      },
    });
  }

  editSchedule(item: any) {
    this.editingId = item.availabilityId;

    this.form = {
      startTime: item.startTime?.slice(0, 16),

      endTime: item.endTime?.slice(0, 16),
    };
  }

  deleteSchedule(id: number) {
    if (!confirm('Delete this schedule?')) {
      return;
    }

    this.scheduleService.delete(id).subscribe({
      next: () => {
        alert('Deleted successfully');

        this.loadSchedules();
      },

      error: (err) => {
        console.error(err);

        alert(err.error?.message);
      },
    });
  }

  resetForm() {
    this.editingId = null;

    this.form = {
      startTime: '',
      endTime: '',
    };
  }
}
