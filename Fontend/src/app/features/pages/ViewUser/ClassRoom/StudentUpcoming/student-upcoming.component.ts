import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ClassEnrollmentService } from '../../../../services/class-enrollment.service';

import { UpcomingScheduleDto } from '../../../../models/upcoming-schedule.model';

import { VideoRoomService } from '../../../../services/video-room.service';

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

  constructor(
    private enrollmentService: ClassEnrollmentService,
    private roomService: VideoRoomService
  ) {}

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

  /*
   * mở nút 15 phút trước buổi học, đóng 15 phút sau khi kết thúc
   */
  canJoinRoom(item: UpcomingScheduleDto): boolean {
    const now = new Date();

    const start = new Date(`${item.studyDate}T${item.startTime}`);

    const end = new Date(`${item.studyDate}T${item.endTime}`);

    return (
      now >= new Date(start.getTime() - 15 * 60 * 1000) &&
      now <= new Date(end.getTime() + 15 * 60 * 1000)
    );
  }

  /*
   * backend tự tạo phòng nếu chưa có và trả joinUrl
   * chỉ học sinh đã đăng ký (Confirmed/InProgress) mới được vào
   */
  joinRoom(item: UpcomingScheduleDto): void {
    this.roomService.join('CLASS', item.sessionId).subscribe({
      next: (res: any) => {
        const url = res?.joinUrl;

        if (url) {
          window.open(url, '_blank');
        } else {
          alert('Không lấy được link phòng học');
        }
      },

      error: (err: any) => {
        console.error(err);

        alert(err.error?.message || 'Không thể vào phòng học');
      },
    });
  }
}
