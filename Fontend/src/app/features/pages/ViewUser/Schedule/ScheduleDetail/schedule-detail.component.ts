import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { TeacherAvailabilityService } from '../../../../services/teacher-availability.service';

import { BookingService } from '../../../../services/booking.service';
import { ReviewService } from '../../../../services/review.service';

@Component({
  selector: 'app-schedule-detail',

  standalone: true,

  imports: [CommonModule],

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
    if (this.schedule?.isBooked) {
      return;
    }

    this.bookingLoading = true;

    this.bookingService.create(this.schedule.availabilityId).subscribe({
      next: (res) => {
        this.bookingLoading = false;

        alert('Booking created successfully');

        this.router.navigate(['/booking', res.bookingId]);
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
    return this.scheduleService.getTeacherName(this.schedule);
  }

  getTeacherAvatar(): string {
    return this.scheduleService.getTeacherAvatar(this.schedule);
  }

  getSpecialty(): string {
    return this.scheduleService.getSpecialty(this.schedule);
  }

  getPricePerHour(): number {
    return this.scheduleService.getPricePerHour(this.schedule);
  }

  getRating(): number {
    return this.scheduleService.getRating(this.schedule);
  }

  getTotalReviews(): number {
    return this.scheduleService.getTotalReviews(this.schedule);
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
    return Math.round((this.getPricePerHour() * this.getDurationHours() + Number.EPSILON) * 100) / 100;
  }

  loadReviews() {
    this.reviews = [];
    this.filteredReviews = [];
    this.reviewError = '';

    const teacherId = this.schedule?.teacherId;
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
        this.reviewError = err.error?.message || 'Failed to load teacher reviews.';
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

    const total = this.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return total / this.reviews.length;
  }

  hasReviews(): boolean {
    return this.reviews.length > 0;
  }
}
