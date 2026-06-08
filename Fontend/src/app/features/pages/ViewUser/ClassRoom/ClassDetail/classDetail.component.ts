import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherClassService } from '../../../../services/teacher-class.service';
import { ClassEnrollmentService } from '../../../../services/class-enrollment.service';
import { ReviewService } from '../../../../services/review.service';
import { VideoRoomService } from '../../../../services/video-room.service';
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

  isEnrolled = false;

  enrollmentId?: number;

  enrollments: any[] = [];

  showTeacherInfo = false;

  showReviews = false;

  reviews: any[] = [];

  filteredReviews: any[] = [];

  reviewLoading = false;

  reviewError = '';

  selectedRatingFilter = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherClassService: TeacherClassService,
    private enrollmentService: ClassEnrollmentService,
    private reviewService: ReviewService,
    private roomService: VideoRoomService,
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

        this.loadReviews();
      },

      error: () => {
        this.loading = false;
      },
    });
  }

  loadReviews(): void {
    const teacherUserId = this.teacherClass?.teacherProfile?.userId;

    if (!teacherUserId) return;

    this.reviewLoading = true;

    this.reviewService.getByTeacherId(teacherUserId).subscribe({
      next: (res) => {
        this.reviews = res;
        this.filteredReviews = res;
        this.reviewLoading = false;
      },

      error: () => {
        this.reviewError = 'Failed to load reviews';
        this.reviewLoading = false;
      },
    });
  }

  setRatingFilter(star: number): void {
    this.selectedRatingFilter = star;
    this.applyReviewFilter();
  }

  applyReviewFilter(): void {
    if (this.selectedRatingFilter === 0) {
      this.filteredReviews = this.reviews;
    } else {
      this.filteredReviews = this.reviews.filter(
        (r) => r.rating === this.selectedRatingFilter,
      );
    }
  }

  getReviewCount(star: number): number {
    return this.reviews.filter((r) => r.rating === star).length;
  }

  hasReviews(): boolean {
    return this.reviews.length > 0;
  }

  getAverageRating(): number {
    if (!this.reviews.length) return 0;
    return (
      this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length
    );
  }

  getReviewAvatar(review: any): string | null {
    return review.studentAvatarUrl
      ? `http://localhost:5108/uploads/${review.studentAvatarUrl}`
      : null;
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

  toggleTeacherInfo(): void {
    this.showTeacherInfo = !this.showTeacherInfo;
  }

  toggleReviews(): void {
    this.showReviews = !this.showReviews;
  }

  getEnrollment() {
    return this.enrollmentId ? this.enrollmentService : null;
  }

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

  canJoinSession(session: ClassSessionDto): boolean {
    const now = new Date();
    const start = new Date(`${session.studyDate}T${session.startTime}`);
    const end = new Date(`${session.studyDate}T${session.endTime}`);
    return (
      now >= new Date(start.getTime() - 15 * 60 * 1000) &&
      now <= new Date(end.getTime() + 15 * 60 * 1000)
    );
  }

  joinSession(session: ClassSessionDto): void {
    this.roomService.join('CLASS', session.sessionId).subscribe({
      next: (res: any) => {
        const url = res?.joinUrl;
        if (url) {
          window.open(url, '_blank');
        } else {
          alert('Không lấy được link phòng học');
        }
      },
      error: (err: any) => {
        alert(err.error?.message || 'Không thể vào phòng học');
      },
    });
  }

  isPastSession(session: ClassSessionDto): boolean {
    const end = new Date(`${session.studyDate}T${session.endTime}`);
    return new Date() > end;
  }

  getStars(rating: number): string[] {
    const stars: string[] = [];
    const rounded = Math.round(rating * 2) / 2;
    for (let i = 1; i <= 5; i++) {
      if (rounded >= i) {
        stars.push('full');
      } else if (rounded >= i - 0.5) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    return stars;
  }
}
