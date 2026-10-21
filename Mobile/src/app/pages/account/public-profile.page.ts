import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '@web/services/account.service';
import { ReviewService } from '@web/services/review.service';
import { mediaUrl } from '../../core/media';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { AvatarComponent } from '../../ui/avatar.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';

/** Public profile (chưa có design — dựng theo ui-spec §3 "Public profile", logic ViewUser/UserPublicProfile). Giá hiển thị $. */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, DatePipe, DecimalPipe, NavBarComponent, AvatarComponent, EmptyStateComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './public-profile.page.html',
  styleUrls: ['./public-profile.page.css'],
})
export class PublicProfilePage implements OnInit {
  private account = inject(AccountService);
  private reviewService = inject(ReviewService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  readonly stars = [1, 2, 3, 4, 5];
  readonly filters = [5, 4, 3, 2, 1];

  profile: any = null;
  loading = true;
  reviews: any[] = [];
  reviewsLoading = false;
  ratingFilter = 0;

  get filteredReviews(): any[] {
    return this.ratingFilter === 0 ? this.reviews : this.reviews.filter((r) => r.rating === this.ratingFilter);
  }

  get averageRating(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length;
  }

  get avatar(): string {
    return mediaUrl(this.profile?.avatarUrl, 'uploads');
  }

  get videoSrc(): string {
    return mediaUrl(this.profile?.teacherProfile?.introVideoUrl, 'videos');
  }

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      this.profile = id ? await firstValueFrom(this.account.getUserPublicProfile(id)) : null;
    } catch {
      this.profile = null;
    }
    this.loading = false;
    this.cdr.markForCheck();
    if (this.profile?.teacherProfile) this.loadReviews(this.profile.userId ?? id);
  }

  private async loadReviews(userId: number): Promise<void> {
    this.reviewsLoading = true;
    this.cdr.markForCheck();
    try {
      this.reviews = (await firstValueFrom(this.reviewService.getByTeacherId(userId))) ?? [];
    } catch {
      this.reviews = [];
    } finally {
      this.reviewsLoading = false;
      this.cdr.markForCheck();
    }
  }

  setFilter(rating: number): void {
    this.ratingFilter = rating;
  }

  countByRating(rating: number): number {
    return this.reviews.filter((r) => r.rating === rating).length;
  }

  reviewerAvatar(r: any): string {
    return mediaUrl(r?.student?.avatarUrl, 'uploads');
  }

  roleLabel(role: string | null | undefined): string {
    const map: Record<string, string> = { User: 'Student', Admin: 'Admin', Moderator: 'Teacher', Teacher: 'Teacher' };
    return (role && map[role]) || role || 'User';
  }
}
