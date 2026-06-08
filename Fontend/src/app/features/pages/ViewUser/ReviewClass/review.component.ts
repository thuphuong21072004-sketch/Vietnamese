import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { BookingService } from '../../../services/booking.service';

import { ClassEnrollmentService } from '../../../services/class-enrollment.service';

import { ReviewService } from '../../../services/review.service';

@Component({
  selector: 'app-review',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './review.component.html',

  styleUrls: ['./review.component.css'],
})
export class ReviewComponent implements OnInit {
  refId = 0;

  refName = 'PrivateLesson';

  rating = 5;

  comment = '';

  loading = false;

  reviewed = false;

  review: any = null;

  booking: any = null;

  enrollment: any = null;

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    private bookingService: BookingService,

    private classEnrollmentService: ClassEnrollmentService,

    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    this.refId = Number(
      this.route.snapshot.paramMap.get('id'),
    );

    this.refName =
      this.route.snapshot.queryParamMap.get('type') ||
      'PrivateLesson';

    if (this.refName === 'PrivateLesson') {
      this.loadBooking();
    }

    if (this.refName === 'CLASS') {
      const enrollmentId = Number(
        this.route.snapshot.queryParamMap.get('enrollmentId'),
      );
      if (enrollmentId) {
        this.loadEnrollment(enrollmentId);
      }
    }

    this.loadReview();
  }

  loadBooking() {
    this.bookingService.getDetail(this.refId).subscribe({
      next: (res) => {
        this.booking = res;
      },

      error: (err) => {
        console.error(err);
      },
    });
  }

  loadEnrollment(enrollmentId: number) {
    this.classEnrollmentService
      .getDetail(enrollmentId)
      .subscribe({
        next: (res) => {
          this.enrollment = res;
        },

        error: (err) => {
          console.error(err);
        },
      });
  }

  loadReview() {
    this.reviewService
      .getByRef(
        this.refName,
        this.refId,
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.reviewed = true;

            this.review = res;
          }
        },

        error: (err) => {
          console.error(err);
        },
      });
  }

  canReview(): boolean {
    if (this.refName === 'PrivateLesson') {
      if (!this.booking) {
        return false;
      }

      return this.booking.status === 3;
    }

    if (this.refName === 'CLASS') {
      if (!this.enrollment) {
        return false;
      }

      return this.enrollment.status === 3;
    }

    return false;
  }

  submit() {
    if (!this.canReview()) {
      alert(
        'You can only review after completion',
      );

      return;
    }

    if (!this.comment.trim()) {
      alert('Comment required');

      return;
    }

    this.loading = true;

    const body = {
      refName: this.refName,

      refId: this.refId,

      rating: this.rating,

      comment: this.comment,
    };

    this.reviewService.create(body).subscribe({
      next: () => {
        this.loading = false;

        alert('Review submitted');

        if (
          this.refName === 'PrivateLesson'
        ) {
          this.router.navigate([
            '/my-bookings',
          ]);
        } else {
          this.router.navigate([
            '/user/myclass',
          ]);
        }
      },

      error: (err) => {
        console.error(err);

        this.loading = false;

        alert(
          err.error?.message ||
            'Failed',
        );
      },
    });
  }

  back() {
    history.back();
  }

  getTeacherAvatar(): string {
    let avatar = '';

    if (
      this.refName === 'PrivateLesson'
    ) {
      avatar =
        this.booking?.instructor?.avatarUrl;
    } else {
      avatar =
        this.enrollment?.teacherClass
          ?.teacherProfile?.avatarUrl;
    }

    if (!avatar) {
      return '';
    }

    if (avatar.startsWith('http')) {
      return avatar;
    }

    return `http://localhost:5108/uploads/${avatar}`;
  }

  getTeacherName(): string {
    if (
      this.refName === 'PrivateLesson'
    ) {
      return (
        this.booking?.instructor?.name ||
        'Teacher'
      );
    }

    return (
      this.enrollment?.teacherClass
        ?.teacherProfile?.teacherName ||
      'Teacher'
    );
  }

  getTeacherSpecialty(): string {
    if (
      this.refName === 'PrivateLesson'
    ) {
      return (
        this.booking?.instructorProfile
          ?.specialty || ''
      );
    }

    return (
      this.enrollment?.teacherClass
        ?.teacherProfile?.specialty || ''
    );
  }

  getDuration(): number {
    if (
      this.refName !==
        'PrivateLesson' ||
      !this.booking
    ) {
      return 0;
    }

    const start = new Date(
      this.booking.startTime,
    );

    const end = new Date(
      this.booking.endTime,
    );

    return (
      Math.round(
        ((end.getTime() -
          start.getTime()) /
          (1000 * 60 * 60)) *
          100,
      ) / 100
    );
  }
}