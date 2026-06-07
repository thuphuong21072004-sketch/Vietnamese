import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherClassService } from '../../../../services/teacher-class.service';
import { ClassEnrollmentService } from '../../../../services/class-enrollment.service';
import {
  TeacherClassDto,
  ClassSessionDto,
} from '../../../../models/teacher-class.model';
@Component({
  selector: 'app-student-course-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ClassDetail.component.html',
  styleUrls: ['./ClassDetail.component.css'],
})
export class StudentCourseDetailComponent implements OnInit {
  loading = false;

  classId = 0;

  teacherClass?: TeacherClassDto;

  selectedSession?: ClassSessionDto;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherClassService: TeacherClassService,
    private enrollmentService: ClassEnrollmentService,
  ) {}

  ngOnInit(): void {
    this.classId = Number(this.route.snapshot.paramMap.get('id'));

    this.loadCourse();

    this.loadEnrollmentStatus();
  }

  loadCourse(): void {
    this.loading = true;

    this.teacherClassService.getClassById(this.classId).subscribe({
      next: (res) => {
        this.teacherClass = res;

        if (
          this.teacherClass.sessions &&
          this.teacherClass.sessions.length > 0
        ) {
          this.selectedSession = this.teacherClass.sessions[0];
        }

        this.loading = false;
      },

      error: () => {
        this.loading = false;
      },
    });
  }

  selectSession(session: ClassSessionDto): void {
    this.selectedSession = session;
  }
  enroll(): void {
    if (!this.teacherClass) {
      return;
    }

    this.enrollmentService.enroll(this.teacherClass.classId).subscribe({
      next: () => {
        alert('Enroll successfully');

        this.loadEnrollmentStatus();

        this.loadCourse();
      },

      error: (err) => {
        alert(err.error?.message);
      },
    });
  }
  isEnrolled = false;

  enrollmentId?: number;
  
  cancel(): void {
    if (!this.enrollmentId) {
      return;
    }

    this.enrollmentService.cancel(this.enrollmentId).subscribe({
      next: () => {
        alert('Enrollment cancelled');

        this.loadEnrollmentStatus();

        this.loadCourse();
      },

      error: (err) => {
        alert(err.error?.message);
      },
    });
  }
  showTeacherInfo = false;

  toggleTeacherInfo(): void {
    this.showTeacherInfo = !this.showTeacherInfo;
  }
  getEnrollment() {
    return this.enrollmentId ? this.enrollmentService : null;
  }

  enrollments: any[] = [];

  loadEnrollmentStatus(): void {
    this.enrollmentService.getMyClasses().subscribe({
      next: (res) => {
        this.enrollments = res;

        const enrollment = res.find((x: any) => x.classId === this.classId);

        if (enrollment) {
          this.enrollmentId = enrollment.enrollmentId;
        } else {
          this.enrollmentId = undefined;
        }
      },
    });
  }

  getStatus(): number | null {
    const enrollment = this.enrollments.find(
      (x: any) => x.classId === this.classId,
    );

    return enrollment ? enrollment.status : null;
  }

  goPayment(): void {
    if (!this.enrollmentId) {
      return;
    }

    this.router.navigate(['/payment', this.enrollmentId], {
      queryParams: {
        type: 'CLASS',
      },
    });
  }
}
