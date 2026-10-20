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

    /*
     * ô datetime-local là giờ máy người dùng, backend lưu UTC
     * → đổi sang ISO UTC trước khi gửi (nếu không sẽ bị lệch múi giờ)
     */
    const payload = {
      startTime: this.toUtcIso(
        this.form.startTime,
      ),

      endTime: this.toUtcIso(
        this.form.endTime,
      ),
    };

    const request =
      this.editingId
        ? this.scheduleService.update(
            this.editingId,
            payload,
          )
        : this.scheduleService.create(
            payload,
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

    /*
     * API trả UTC ("...Z") → đổi về giờ máy người dùng cho ô datetime-local
     */
    this.form = {
      startTime: this.toLocalInput(
        item.startTime,
      ),

      endTime: this.toLocalInput(
        item.endTime,
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

  /*
   * "yyyy-MM-ddTHH:mm" (giờ máy) → ISO UTC
   */
  private toUtcIso(
    local: string,
  ): string {
    return new Date(
      local,
    ).toISOString();
  }

  /*
   * ISO UTC → "yyyy-MM-ddTHH:mm" (giờ máy) cho datetime-local
   */
  private toLocalInput(
    utc: string | null | undefined,
  ): string {
    if (!utc) {
      return '';
    }

    const d = new Date(utc);

    const pad = (n: number) =>
      String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}