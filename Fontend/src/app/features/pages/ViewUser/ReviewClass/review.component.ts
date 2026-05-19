import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { ReviewService } from '../../../services/review.service';

@Component({
  selector: 'app-review',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './review.component.html',

  styleUrls: ['./review.component.css'],
})
export class ReviewComponent implements OnInit {
  bookingId = 0;

  rating = 5;

  comment = '';

  loading = false;

  reviewed = false;

  review: any = null;

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.paramMap.get('id'));

    this.loadReview();
  }

  loadReview() {
    this.reviewService.getByBookingId(this.bookingId).subscribe({
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

  submit() {
    if (!this.comment.trim()) {
      alert('Comment required');

      return;
    }

    this.loading = true;

    const body = {
      bookingId: this.bookingId,

      rating: this.rating,

      comment: this.comment,
    };

    this.reviewService.create(body).subscribe({
      next: () => {
        this.loading = false;

        alert('Review submitted');

        this.router.navigate(['/my-bookings']);
      },

      error: (err) => {
        console.error(err);

        this.loading = false;

        alert(err.error?.message || 'Failed');
      },
    });
  }

  back() {
    history.back();
  }
}
