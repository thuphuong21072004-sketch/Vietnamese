import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { TeacherAvailabilityService } from '../../../../services/teacher-availability.service';
import { BookingService } from '../../../../services/booking.service';
import { ReviewService } from '../../../../services/review.service';

@Component({
  selector: 'app-schedule-detail',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './schedule-detail.component.html',

  styleUrls: ['./schedule-detail.component.css'],
})
export class ScheduleDetailComponent implements OnInit {
  loading = true;

  bookingLoading = false;

  schedule: any = null;

  reviews: any[] = [];

  filteredReviews: any[] = [];

  reviewLoading = false;

  reviewError = '';

  selectedRatingFilter = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,

    public scheduleService: TeacherAvailabilityService,

    private bookingService: BookingService,

    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.loadDetail(id);
  }

  loadDetail(id: number) {
    this.loading = true;

    this.scheduleService.getDetail(id).subscribe({
      next: (res) => {
        this.schedule = res;

        this.loadReviews();

        this.loading = false;
      },

      error: (err) => {
        console.error(err);

        alert(err.error?.message || 'Failed to load schedule');

        this.loading = false;
      },
    });
  }

  bookSchedule() {
    if (this.schedule?.status !== 0 || this.bookingLoading) {
      return;
    }

    this.bookingLoading = true;

    this.bookingService.create(this.schedule.availabilityId).subscribe({
      next: (bookingRes) => {
        this.bookingLoading = false;

        this.router.navigate(['/payment', bookingRes.bookingId]);
      },

      error: (err) => {
        console.error(err);

        this.bookingLoading = false;

        alert(err.error?.message || 'Booking failed');
      },
    });
  }

  back() {
    history.back();
  }

  getTeacherName(): string {
    return this.schedule?.instructor?.name || 'Teacher';
  }

  getTeacherAvatar(): string {
    const avatar = this.schedule?.instructor?.avatarUrl;

    if (!avatar) {
      return '';
    }

    if (avatar.startsWith('http')) {
      return avatar;
    }

    return `http://localhost:5108/uploads/${avatar}`;
  }

  getSpecialty(): string {
    return this.schedule?.instructorProfile?.specialty || '';
  }

  getPricePerHour(): number {
    return this.schedule?.instructorProfile?.pricePerHour || 0;
  }

  getRating(): number {
    return this.schedule?.instructorProfile?.ratingAverage || 0;
  }

  getTotalReviews(): number {
    return this.schedule?.instructorProfile?.totalReviews || 0;
  }

  getDurationHours(): number {
    if (!this.schedule?.startTime || !this.schedule?.endTime) {
      return 0;
    }

    const start = new Date(this.schedule.startTime);

    const end = new Date(this.schedule.endTime);

    const diff = Math.max(0, end.getTime() - start.getTime());

    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  }

  getTotalAmount(): number {
    return (
      Math.round(
        (this.getPricePerHour() * this.getDurationHours() + Number.EPSILON) *
          100,
      ) / 100
    );
  }

  loadReviews() {
    this.reviews = [];

    this.filteredReviews = [];

    this.reviewError = '';

    const teacherId = this.schedule?.instructorId;

    if (!teacherId) {
      this.reviewError = 'No teacher ID available.';

      return;
    }

    this.reviewLoading = true;

    this.reviewService.getByTeacherId(teacherId).subscribe({
      next: (res) => {
        this.reviews = res || [];

        this.applyReviewFilter();

        this.reviewLoading = false;
      },

      error: (err) => {
        console.error(err);

        this.reviewError =
          err.error?.message || 'Failed to load teacher reviews.';

        this.reviewLoading = false;
      },
    });
  }

  setRatingFilter(rating: number) {
    this.selectedRatingFilter = rating;

    this.applyReviewFilter();
  }

  applyReviewFilter() {
    if (this.selectedRatingFilter <= 0) {
      this.filteredReviews = [...this.reviews];
    } else {
      this.filteredReviews = this.reviews.filter(
        (review) => review.rating === this.selectedRatingFilter,
      );
    }
  }

  getReviewCount(rating: number): number {
    return this.reviews.filter((review) => review.rating === rating).length;
  }

  getAverageRating(): number {
    if (!this.reviews.length) {
      return 0;
    }

    const total = this.reviews.reduce(
      (sum, review) => sum + (review.rating || 0),
      0,
    );

    return total / this.reviews.length;
  }

  hasReviews(): boolean {
    return this.reviews.length > 0;
  }

  getTeacherVideo(): string {
    const video = this.schedule?.instructorProfile?.introVideoUrl;

    if (!video) {
      return '';
    }

    if (video.startsWith('http')) {
      return video;
    }

    return `http://localhost:5108/videos/${video}`;
  }

  getReviewAvatar(review: any): string {
    const avatar = review?.studentAvatar || review?.student?.avatarUrl;

    if (!avatar) {
      return '';
    }

    if (avatar.startsWith('http')) {
      return avatar;
    }

    return `http://localhost:5108/uploads/${avatar}`;
  }
}
