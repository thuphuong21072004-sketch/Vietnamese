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
export class TeacherScheduleComponent
  implements OnInit
{
  schedules: any[] = [];

  loading = false;

  /*
   * filter
   */
  selectedDate = '';

  selectedStatus = '';

  /*
   * create/update form
   */
  form: any = {
    startTime: '',

    endTime: '',
  };

  editingId: number | null =
    null;

  constructor(
    private scheduleService:
      TeacherAvailabilityService,
  ) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  /*
   * load schedules
   */
  loadSchedules() {
    this.loading = true;

    const status =
      this.selectedStatus !== ''
        ? Number(
            this.selectedStatus,
          )
        : undefined;

    this.scheduleService
      .getMySchedules(
        status,
        this.selectedDate,
      )

      .subscribe({
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

  /*
   * create/update schedule
   */
  saveSchedule() {
    if (
      !this.form.startTime ||

      !this.form.endTime
    ) {
      alert(
        'Please select time',
      );

      return;
    }

    const request =
      this.editingId
        ? this.scheduleService.update(
            this.editingId,
            this.form,
          )
        : this.scheduleService.create(
            this.form,
          );

    request.subscribe({
      next: () => {
        alert(
          this.editingId
            ? 'Schedule updated'
            : 'Schedule created',
        );

        this.resetForm();

        this.loadSchedules();
      },

      error: (err) => {
        console.error(err);

        alert(
          err.error?.message ||
            'Operation failed',
        );
      },
    });
  }

  /*
   * edit
   */
  editSchedule(item: any) {
    /*
     * chỉ cho edit available
     */
    if (item.status !== 0) {
      return;
    }

    this.editingId =
      item.availabilityId;

    this.form = {
      startTime:
        item.startTime?.slice(
          0,
          16,
        ),

      endTime:
        item.endTime?.slice(
          0,
          16,
        ),
    };

    /*
     * scroll top
     */
    window.scrollTo({
      top: 0,

      behavior: 'smooth',
    });
  }

  /*
   * delete
   */
  deleteSchedule(id: number) {
    if (
      !confirm(
        'Delete this schedule?',
      )
    ) {
      return;
    }

    this.scheduleService
      .delete(id)

      .subscribe({
        next: () => {
          alert(
            'Deleted successfully',
          );

          this.loadSchedules();
        },

        error: (err) => {
          console.error(err);

          alert(
            err.error?.message ||
              'Delete failed',
          );
        },
      });
  }

  /*
   * reset form
   */
  resetForm() {
    this.editingId = null;

    this.form = {
      startTime: '',

      endTime: '',
    };
  }

  /*
   * available count
   */
  getAvailableCount(): number {
    return this.schedules.filter(
      (x) => x.status === 0,
    ).length;
  }

  /*
   * booked count
   */
  getBookedCount(): number {
    return this.schedules.filter(
      (x) => x.status === 1,
    ).length;
  }

  /*
   * expired count
   */
  getExpiredCount(): number {
    return this.schedules.filter(
      (x) => x.status === 2,
    ).length;
  }
}