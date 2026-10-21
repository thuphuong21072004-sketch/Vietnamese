import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonModal, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { TravelService } from '@web/services/travel.service';
import { StudentTripDto, TeacherScheduleDto } from '@web/models/travel.model';
import { TeacherClassDto } from '@web/models/teacher-class.model';
import { VIETNAM_DESTINATIONS, DestinationGroup } from '@web/models/vietnam-destinations';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { IconComponent } from '../../ui/icon.component';
import { AvatarComponent } from '../../ui/avatar.component';
import { BadgeComponent } from '../../ui/badge.component';
import { LoadingComponent, EmptyStateComponent } from '../../ui/states.component';
import { TRAVEL_ICONS, dateRange, vnDateString } from './travel-utils';

interface TripForm {
  destination: string;
  specificLocation: string;
  phoneNumber: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: TripForm = { destination: '', specificLocation: '', phoneNumber: '', startDate: '', endDate: '' };

/** 21 My Travel Plans — design-mobile/screens/TravelTrips.dc.html (gộp nav tile của Travel Home). */
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
    DecimalPipe,
    NavBarComponent,
    IconComponent,
    AvatarComponent,
    BadgeComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './travel-trips.page.html',
  styleUrls: ['./travel-shared.css', './travel-trips.page.css'],
  host: { class: 'bg-travel' },
})
export class TravelTripsPage implements OnInit {
  private travel = inject(TravelService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = TRAVEL_ICONS;
  readonly destinationGroups: DestinationGroup[] = VIETNAM_DESTINATIONS;
  readonly statusChips = [
    { value: '', label: 'All statuses' },
    { value: '0', label: 'Finding Teacher' },
    { value: '1', label: 'Matched' },
    { value: '2', label: 'Cancelled' },
  ];

  trips: StudentTripDto[] = [];
  loading = true;
  saving = false;

  // Form New / Edit Trip (bottom sheet)
  showForm = false;
  editingTripId: number | null = null;
  form: TripForm = { ...EMPTY_FORM };
  selectedProvince = '';
  selectedSpot = '';

  // Lọc
  filterStatus = '';
  filterFrom = '';
  filterTo = '';
  showDates = false;
  draftFrom = '';
  draftTo = '';

  // Panel Find Teachers / View Classes
  suggestions: Record<number, TeacherScheduleDto[] | undefined> = {};
  pendingByTrip: Record<number, Record<number, { id: number; requestType: number }>> = {};
  loadingSuggestionsFor: number | null = null;
  showSuggestionsFor: number | null = null;
  sendingInvite: { scheduleId: number; tripId: number } | null = null;
  busyRequestId: number | null = null;

  reservedClasses: Record<number, TeacherClassDto[] | undefined> = {};
  showClassesFor: number | null = null;
  loadingClassesFor: number | null = null;

  ngOnInit(): void {
    this.loadTrips();
  }

  private refresh(): void {
    this.cdr.markForCheck();
  }

  loadTrips(event?: CustomEvent): void {
    if (!event && !this.trips.length) this.loading = true;
    this.travel.getMyTrips().subscribe({
      next: (data) => {
        this.trips = data ?? [];
        this.loading = false;
        this.refresh();
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
      error: (err) => {
        this.loading = false;
        this.fb.toast(errorMessage(err, 'Cannot load trips.'), 'error');
        this.refresh();
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
    });
  }

  // ---- Lọc ----
  get filtered(): StudentTripDto[] {
    return this.trips.filter((t) => {
      if (this.filterStatus !== '' && t.status !== +this.filterStatus) return false;
      if (this.filterFrom && t.startDate < this.filterFrom) return false;
      if (this.filterTo && t.endDate > this.filterTo) return false;
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
    this.draftFrom = '';
    this.draftTo = '';
    this.showDates = false;
  }

  // ---- Form ----
  /** Backend yêu cầu ngày bắt đầu ≥ hôm nay (lịch VN) + 30 ngày. */
  get minStartDate(): string {
    return vnDateString(30);
  }

  get availableSpots(): string[] {
    return this.destinationGroups.find((g) => g.province === this.selectedProvince)?.spots ?? [];
  }

  onProvinceChange(): void {
    this.form.destination = this.selectedProvince;
    this.selectedSpot = '';
    this.form.specificLocation = '';
  }

  onSpotChange(): void {
    this.form.specificLocation = this.selectedSpot;
  }

  openCreate(): void {
    this.form = { ...EMPTY_FORM };
    this.selectedProvince = '';
    this.selectedSpot = '';
    this.editingTripId = null;
    this.showForm = true;
  }

  openEdit(trip: StudentTripDto): void {
    this.form = {
      destination: trip.destination,
      specificLocation: trip.specificLocation ?? '',
      phoneNumber: trip.phoneNumber ?? '',
      startDate: (trip.startDate ?? '').substring(0, 10),
      endDate: (trip.endDate ?? '').substring(0, 10),
    };
    this.selectedProvince = trip.destination;
    this.selectedSpot = trip.specificLocation ?? '';
    this.editingTripId = trip.tripId;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingTripId = null;
  }

  save(): void {
    if (!this.form.destination.trim()) {
      this.fb.toast('Please select a province / city.', 'error');
      return;
    }
    if (!this.form.startDate || !this.form.endDate) {
      this.fb.toast('Please select start and end dates.', 'error');
      return;
    }
    if (this.form.startDate > this.form.endDate) {
      this.fb.toast('Start date must be before end date', 'error');
      return;
    }
    // So sánh chuỗi "yyyy-MM-dd" theo lịch VN, cùng quy tắc với backend
    if (this.form.startDate.substring(0, 10) < this.minStartDate) {
      this.fb.toast('Start date must be at least 30 days from today', 'error');
      return;
    }
    this.saving = true;
    const editing = this.editingTripId;
    const obs$ = editing ? this.travel.updateTrip(editing, this.form) : this.travel.createTrip(this.form);
    obs$.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.editingTripId = null;
        this.fb.toast(editing ? 'Trip updated' : 'Trip created', 'success');
        this.loadTrips();
      },
      error: (err) => {
        this.saving = false;
        this.fb.toast(errorMessage(err, 'Failed'), 'error');
        this.refresh();
      },
    });
    this.refresh();
  }

  async deleteTrip(trip: StudentTripDto): Promise<void> {
    const ok = await this.fb.confirm({
      header: 'Delete this trip?',
      message: `${trip.destination} · ${this.range(trip)}`,
      okText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.travel.deleteTrip(trip.tripId).subscribe({
      next: () => {
        this.fb.toast('Trip deleted', 'success');
        this.loadTrips();
      },
      error: (err) => this.fb.toast(errorMessage(err, 'Cannot delete trip'), 'error'),
    });
  }

  // ---- Find Teachers ----
  findTeachers(tripId: number): void {
    if (this.showSuggestionsFor === tripId) {
      this.showSuggestionsFor = null;
      return;
    }
    this.loadingSuggestionsFor = tripId;
    this.loadSuggestions(tripId, () => (this.loadingSuggestionsFor = null));
  }

  private loadSuggestions(tripId: number, done?: () => void): void {
    forkJoin({
      teachers: this.travel.getSuggestedTeachers(tripId),
      requests: this.travel.getRequestsByTrip(tripId),
    }).subscribe({
      next: ({ teachers, requests }) => {
        this.suggestions[tripId] = teachers ?? [];
        this.showSuggestionsFor = tripId;
        const pending: Record<number, { id: number; requestType: number }> = {};
        (requests ?? [])
          .filter((r) => r.status === 0)
          .forEach((r) => (pending[r.scheduleId] = { id: r.matchRequestId, requestType: r.requestType }));
        this.pendingByTrip[tripId] = pending;
        done?.();
        this.refresh();
      },
      error: (err) => {
        done?.();
        this.fb.toast(errorMessage(err, 'Cannot load teachers.'), 'error');
        this.refresh();
      },
    });
    this.refresh();
  }

  getPendingRequest(tripId: number, scheduleId: number): { id: number; requestType: number } | undefined {
    return this.pendingByTrip[tripId]?.[scheduleId];
  }

  isSendingInvite(scheduleId: number, tripId: number): boolean {
    return this.sendingInvite?.scheduleId === scheduleId && this.sendingInvite?.tripId === tripId;
  }

  sendInvite(scheduleId: number, tripId: number): void {
    this.sendingInvite = { scheduleId, tripId };
    this.travel.sendRequest(scheduleId, tripId, 0).subscribe({
      next: () => {
        this.sendingInvite = null;
        this.fb.toast('Invitation sent', 'success');
        this.loadSuggestions(tripId);
      },
      error: (err) => {
        this.sendingInvite = null;
        this.fb.toast(errorMessage(err, 'Failed'), 'error');
        this.refresh();
      },
    });
    this.refresh();
  }

  cancelInvite(matchRequestId: number, tripId: number): void {
    this.busyRequestId = matchRequestId;
    this.travel.cancelRequest(matchRequestId).subscribe({
      next: () => {
        this.busyRequestId = null;
        this.loadSuggestions(tripId);
      },
      error: (err) => {
        this.busyRequestId = null;
        this.fb.toast(errorMessage(err, 'Failed'), 'error');
        this.refresh();
      },
    });
  }

  accept(matchRequestId: number): void {
    this.busyRequestId = matchRequestId;
    this.travel.acceptRequest(matchRequestId).subscribe({
      next: () => {
        this.busyRequestId = null;
        this.showSuggestionsFor = null;
        this.fb.toast('Request accepted', 'success');
        this.loadTrips();
      },
      error: (err) => {
        this.busyRequestId = null;
        this.fb.toast(errorMessage(err, 'Failed'), 'error');
        this.refresh();
      },
    });
  }

  reject(matchRequestId: number, tripId: number): void {
    this.busyRequestId = matchRequestId;
    this.travel.rejectRequest(matchRequestId).subscribe({
      next: () => {
        this.busyRequestId = null;
        this.loadSuggestions(tripId);
      },
      error: (err) => {
        this.busyRequestId = null;
        this.fb.toast(errorMessage(err, 'Failed'), 'error');
        this.refresh();
      },
    });
  }

  // ---- View Classes ----
  viewReservedClasses(tripId: number): void {
    if (this.showClassesFor === tripId) {
      this.showClassesFor = null;
      return;
    }
    this.loadingClassesFor = tripId;
    this.travel.getReservedClassesForTrip(tripId).subscribe({
      next: (classes) => {
        this.reservedClasses[tripId] = classes ?? [];
        this.showClassesFor = tripId;
        this.loadingClassesFor = null;
        this.refresh();
      },
      error: (err) => {
        this.loadingClassesFor = null;
        this.fb.toast(errorMessage(err, 'Cannot load classes.'), 'error');
        this.refresh();
      },
    });
  }

  // ---- Hiển thị ----
  statusLabel(status: number): string {
    return ({ 0: 'Finding Teacher', 1: 'Matched', 2: 'Cancelled' } as Record<number, string>)[status] ?? '';
  }

  range(trip: { startDate: string; endDate: string }): string {
    return dateRange(trip.startDate, trip.endDate);
  }

  freeRange(s: TeacherScheduleDto): string {
    return dateRange(s.availableFrom, s.availableTo, false);
  }

  avatar(file: string | null | undefined): string {
    return mediaUrl(file, 'uploads');
  }

  time(t: string | null | undefined): string {
    return (t ?? '').slice(0, 5);
  }
}
