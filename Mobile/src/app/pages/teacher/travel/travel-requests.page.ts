import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TravelService } from '@web/services/travel.service';
import { MatchRequestDto } from '@web/models/travel.model';
import { FeedbackService } from '../../../core/feedback.service';
import { errorMessage } from '../../../core/errors';
import { mediaUrl } from '../../../core/media';
import { NavBarComponent } from '../../../ui/nav-bar.component';
import { AvatarComponent } from '../../../ui/avatar.component';
import { BadgeComponent } from '../../../ui/badge.component';
import { IconComponent, ICONS } from '../../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../../ui/states.component';
import { T_ICONS, requestStatusLabel } from '../teacher.utils';
import { TeacherTravelTabsComponent } from './travel-tabs.component';

/** Travel Requests (GV) — chưa có design riêng, dựng theo TravelRequests.dc.html (học viên) + ui-spec §3.3 */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    FormsModule,
    RouterLink,
    DatePipe,
    NavBarComponent,
    AvatarComponent,
    BadgeComponent,
    IconComponent,
    EmptyStateComponent,
    LoadingComponent,
    TeacherTravelTabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'bg-travel' },
  templateUrl: './travel-requests.page.html',
  styleUrls: ['../teacher-shared.css', './travel.css', './travel-requests.page.css'],
})
export class TeacherTravelRequestsPage implements OnInit {
  private travelService = inject(TravelService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = { ...T_ICONS, pin: ICONS.pin };
  readonly statusLabel = requestStatusLabel;
  readonly statusChips = [
    { value: '', label: 'All Statuses' },
    { value: '0', label: 'Pending' },
    { value: '1', label: 'Accepted' },
    { value: '2', label: 'Rejected' },
    { value: '3', label: 'Cancelled' },
  ];

  requests: MatchRequestDto[] = [];
  loading = true;
  filterStatus = '';
  filterFrom = '';
  filterTo = '';

  ngOnInit(): void {
    this.load();
  }

  get filtered(): MatchRequestDto[] {
    return this.requests.filter((r) => {
      if (this.filterStatus !== '' && r.status !== +this.filterStatus) return false;
      if (this.filterFrom && r.startDate < this.filterFrom) return false;
      if (this.filterTo && r.endDate > this.filterTo) return false;
      return true;
    });
  }

  get hasFilter(): boolean {
    return !!(this.filterStatus || this.filterFrom || this.filterTo);
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterFrom = '';
    this.filterTo = '';
  }

  async load(event?: CustomEvent, silent = false): Promise<void> {
    this.loading = !event && !silent;
    this.cdr.markForCheck();
    const [inc, out] = await Promise.all([
      firstValueFrom(this.travelService.getIncomingRequests().pipe(catchError(() => of([] as MatchRequestDto[])))),
      firstValueFrom(this.travelService.getOutgoingRequests().pipe(catchError(() => of([] as MatchRequestDto[])))),
    ]);
    const seen = new Set<number>();
    this.requests = [...(inc ?? []), ...(out ?? [])]
      .filter((r) => (seen.has(r.matchRequestId) ? false : (seen.add(r.matchRequestId), true)))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  avatar(file: string | null | undefined): string {
    return mediaUrl(file, 'uploads');
  }

  /** requestType 1 = giáo viên mời (mình gửi). */
  iSent(r: MatchRequestDto): boolean {
    return r.requestType === 1;
  }

  typeLabel(r: MatchRequestDto): string {
    return r.requestType === 1 ? 'You invited student' : 'Student invited you';
  }

  createClassParams(r: MatchRequestDto): Record<string, string | number | undefined> {
    return {
      province: r.destination,
      specificLocation: r.specificLocation,
      matchRequestId: r.matchRequestId,
      tripStartDate: r.startDate?.substring(0, 10),
    };
  }

  async accept(r: MatchRequestDto): Promise<void> {
    await this.act(() => this.travelService.acceptRequest(r.matchRequestId), 'Request accepted');
  }

  async reject(r: MatchRequestDto): Promise<void> {
    const ok = await this.fb.confirm({ header: 'Reject this request?', okText: 'Reject', danger: true });
    if (ok) await this.act(() => this.travelService.rejectRequest(r.matchRequestId));
  }

  async cancel(r: MatchRequestDto): Promise<void> {
    const ok = await this.fb.confirm({ header: 'Cancel this invite?', okText: 'Cancel Invite', cancelText: 'Keep', danger: true });
    if (ok) await this.act(() => this.travelService.cancelRequest(r.matchRequestId));
  }

  private async act(call: () => ReturnType<TravelService['acceptRequest']>, success?: string): Promise<void> {
    try {
      await firstValueFrom(call());
      if (success) this.fb.toast(success, 'success');
      this.load(undefined, true);
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed'), 'error');
    }
  }
}
