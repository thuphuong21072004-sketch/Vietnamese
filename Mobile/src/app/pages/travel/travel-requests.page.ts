import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonModal, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TravelService } from '@web/services/travel.service';
import { MatchRequestDto } from '@web/models/travel.model';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { IconComponent } from '../../ui/icon.component';
import { AvatarComponent } from '../../ui/avatar.component';
import { BadgeComponent } from '../../ui/badge.component';
import { LoadingComponent, EmptyStateComponent } from '../../ui/states.component';
import { TRAVEL_ICONS, dateRange } from './travel-utils';

/** 22 Travel Requests — design-mobile/screens/TravelRequests.dc.html */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    FormsModule,
    RouterLink,
    NavBarComponent,
    IconComponent,
    AvatarComponent,
    BadgeComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './travel-requests.page.html',
  styleUrls: ['./travel-shared.css', './travel-requests.page.css'],
  host: { class: 'bg-travel' },
})
export class TravelRequestsPage implements OnInit {
  private travel = inject(TravelService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = TRAVEL_ICONS;
  readonly statusChips = [
    { value: '', label: 'All Statuses' },
    { value: '0', label: 'Pending' },
    { value: '1', label: 'Accepted' },
    { value: '2', label: 'Rejected' },
    { value: '3', label: 'Cancelled' },
  ];

  requests: MatchRequestDto[] = [];
  loading = true;
  busyId: number | null = null;

  filterStatus = '';
  filterFrom = '';
  filterTo = '';
  showDates = false;
  draftFrom = '';
  draftTo = '';

  ngOnInit(): void {
    this.loadAll();
  }

  /** Gộp lời mời đến + đi, bỏ trùng, sắp theo ngày bắt đầu (như web). */
  async loadAll(event?: CustomEvent, silent = false): Promise<void> {
    if (!event && !silent) this.loading = true;
    this.cdr.markForCheck();
    let failed = false;
    const safe = (o: ReturnType<TravelService['getIncomingRequests']>) =>
      firstValueFrom(
        o.pipe(
          catchError(() => {
            failed = true;
            return of([] as MatchRequestDto[]);
          }),
        ),
      );
    const [inc, out] = await Promise.all([safe(this.travel.getIncomingRequests()), safe(this.travel.getOutgoingRequests())]);
    const seen = new Set<number>();
    const all = [...(inc ?? []), ...(out ?? [])].filter((r) => {
      if (seen.has(r.matchRequestId)) return false;
      seen.add(r.matchRequestId);
      return true;
    });
    all.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    this.requests = all;
    this.loading = false;
    if (failed) this.fb.toast('Cannot load some requests.', 'error');
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  // ---- Lọc ----
  get filtered(): MatchRequestDto[] {
    return this.requests.filter((r) => {
      if (this.filterStatus !== '' && r.status !== +this.filterStatus) return false;
      if (this.filterFrom && r.startDate < this.filterFrom) return false;
      if (this.filterTo && r.endDate > this.filterTo) return false;
      return true;
    });
  }

  get hasDateFilter(): boolean {
    return !!(this.filterFrom || this.filterTo);
  }

  get dateChipLabel(): string {
    if (!this.hasDateFilter) return 'Dates';
    const f = (d: string) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '…');
    return `${f(this.filterFrom)} – ${f(this.filterTo)}`;
  }

  openDates(): void {
    this.draftFrom = this.filterFrom;
    this.draftTo = this.filterTo;
    this.showDates = true;
  }

  applyDates(): void {
    this.filterFrom = this.draftFrom;
    this.filterTo = this.draftTo;
    this.showDates = false;
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterFrom = '';
    this.filterTo = '';
  }

  // ---- Hành động ----
  /** requestType 0 = học viên (bạn) gửi lời mời → được hủy. */
  youSent(r: MatchRequestDto): boolean {
    return r.requestType === 0;
  }

  private act(id: number, call: 'acceptRequest' | 'rejectRequest' | 'cancelRequest', done: string): void {
    this.busyId = id;
    this.cdr.markForCheck();
    this.travel[call](id).subscribe({
      next: () => {
        this.busyId = null;
        this.fb.toast(done, 'success');
        this.loadAll(undefined, true);
      },
      error: (err) => {
        this.busyId = null;
        this.fb.toast(errorMessage(err, 'Failed'), 'error');
        this.cdr.markForCheck();
      },
    });
  }

  accept(id: number): void {
    this.act(id, 'acceptRequest', 'Request accepted');
  }

  reject(id: number): void {
    this.act(id, 'rejectRequest', 'Request rejected');
  }

  cancel(id: number): void {
    this.act(id, 'cancelRequest', 'Request cancelled');
  }

  // ---- Hiển thị ----
  statusLabel(status: number): string {
    return ({ 0: 'Pending', 1: 'Accepted', 2: 'Rejected', 3: 'Cancelled' } as Record<number, string>)[status] ?? '';
  }

  typeLabel(r: MatchRequestDto): string {
    return r.requestType === 0 ? 'You invited teacher' : 'Teacher invited you';
  }

  place(r: MatchRequestDto): string {
    return r.specificLocation ? `${r.destination} — ${r.specificLocation}` : (r.destination ?? '');
  }

  range(r: MatchRequestDto): string {
    return dateRange(r.startDate, r.endDate);
  }

  avatar(file: string | null | undefined): string {
    return mediaUrl(file, 'uploads');
  }
}
