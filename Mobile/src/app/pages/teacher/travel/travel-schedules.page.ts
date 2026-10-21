import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { TravelService } from '@web/services/travel.service';
import { MatchRequestDto, StudentTripDto, TeacherScheduleDto } from '@web/models/travel.model';
import { FeedbackService } from '../../../core/feedback.service';
import { errorMessage } from '../../../core/errors';
import { mediaUrl } from '../../../core/media';
import { NavBarComponent } from '../../../ui/nav-bar.component';
import { AvatarComponent } from '../../../ui/avatar.component';
import { BadgeComponent } from '../../../ui/badge.component';
import { IconComponent, ICONS } from '../../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../../ui/states.component';
import { DESTINATIONS, T_ICONS, requestStatusLabel, tripStatusLabel } from '../teacher.utils';
import { TeacherTravelTabsComponent } from './travel-tabs.component';

/** My Travel Schedules (GV) — chưa có design, dựng theo ui-spec §3.3 (phong cách TravelTrips.dc.html) */
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
  templateUrl: './travel-schedules.page.html',
  styleUrls: ['../teacher-shared.css', './travel.css', './travel-schedules.page.css'],
})
export class TeacherTravelSchedulesPage implements OnInit {
  private travelService = inject(TravelService);
  private fb = inject(FeedbackService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild(IonContent) content?: IonContent;

  readonly icons = { ...T_ICONS, pin: ICONS.pin };
  readonly destinations = DESTINATIONS;
  readonly tripStatusLabel = tripStatusLabel;
  readonly requestStatusLabel = requestStatusLabel;

  schedules: TeacherScheduleDto[] = [];
  loading = true;
  saving = false;

  showForm = false;
  editingScheduleId: number | null = null;
  form = { destination: '', availableFrom: '', availableTo: '', status: 1 };

  suggestions: Record<number, StudentTripDto[] | undefined> = {};
  pendingBySchedule: Record<number, Record<number, { id: number; requestType: number }>> = {};
  loadingSuggestionsFor: number | null = null;
  showSuggestionsFor: number | null = null;
  sendingInvite: { scheduleId: number; tripId: number } | null = null;

  showRequestsFor: number | null = null;
  requestsBySchedule: Record<number, MatchRequestDto[] | undefined> = {};

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('new')) this.openCreate();
    this.load();
  }

  async load(event?: CustomEvent): Promise<void> {
    this.loading = !event && !this.schedules.length;
    this.cdr.markForCheck();
    try {
      this.schedules = await firstValueFrom(this.travelService.getMySchedules());
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Cannot load schedules'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  avatar(file: string | null | undefined): string {
    return mediaUrl(file, 'uploads');
  }

  statusLabel(status: number): string {
    return status === 1 ? 'Open' : 'Closed';
  }

  openCreate(): void {
    this.form = { destination: '', availableFrom: '', availableTo: '', status: 1 };
    this.editingScheduleId = null;
    this.showForm = true;
    this.content?.scrollToTop(300);
    this.cdr.markForCheck();
  }

  openEdit(s: TeacherScheduleDto): void {
    this.form = {
      destination: s.destination,
      availableFrom: s.availableFrom?.substring(0, 10),
      availableTo: s.availableTo?.substring(0, 10),
      status: s.status,
    };
    this.editingScheduleId = s.scheduleId;
    this.showForm = true;
    this.content?.scrollToTop(300);
    this.cdr.markForCheck();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingScheduleId = null;
  }

  async save(): Promise<void> {
    if (!this.form.destination.trim() || !this.form.availableFrom || !this.form.availableTo) {
      this.fb.toast('Please choose a province and dates', 'error');
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(
        this.editingScheduleId
          ? this.travelService.updateSchedule(this.editingScheduleId, this.form)
          : this.travelService.createSchedule(this.form),
      );
      this.showForm = false;
      this.editingScheduleId = null;
      this.fb.toast('Schedule saved', 'success');
      this.load();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed'), 'error');
    }
    this.saving = false;
    this.cdr.markForCheck();
  }

  async remove(s: TeacherScheduleDto): Promise<void> {
    const ok = await this.fb.confirm({ header: 'Delete this schedule?', okText: 'Delete', danger: true });
    if (!ok) return;
    try {
      await firstValueFrom(this.travelService.deleteSchedule(s.scheduleId));
      this.load();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed'), 'error');
    }
  }

  async close(s: TeacherScheduleDto): Promise<void> {
    const ok = await this.fb.confirm({
      header: 'Close this schedule?',
      message: 'It will no longer appear in matches.',
      okText: 'Close',
      danger: true,
    });
    if (!ok) return;
    this.setStatus(s, 0);
  }

  reopen(s: TeacherScheduleDto): void {
    this.setStatus(s, 1);
  }

  private async setStatus(s: TeacherScheduleDto, status: number): Promise<void> {
    try {
      await firstValueFrom(this.travelService.updateSchedule(s.scheduleId, { ...s, status }));
      this.load();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed'), 'error');
    }
  }

  // ---- Matching students ----
  async findStudents(scheduleId: number): Promise<void> {
    if (this.showSuggestionsFor === scheduleId) {
      this.showSuggestionsFor = null;
      return;
    }
    this.loadingSuggestionsFor = scheduleId;
    this.cdr.markForCheck();
    await this.loadSuggestions(scheduleId);
    this.loadingSuggestionsFor = null;
    this.cdr.markForCheck();
  }

  private async loadSuggestions(scheduleId: number): Promise<void> {
    try {
      const [students, requests] = await Promise.all([
        firstValueFrom(this.travelService.getSuggestedStudents(scheduleId)),
        firstValueFrom(this.travelService.getRequestsBySchedule(scheduleId)),
      ]);
      this.suggestions[scheduleId] = students;
      this.showSuggestionsFor = scheduleId;
      const pending: Record<number, { id: number; requestType: number }> = {};
      requests
        .filter((r) => r.status === 0)
        .forEach((r) => (pending[r.tripId] = { id: r.matchRequestId, requestType: r.requestType }));
      this.pendingBySchedule[scheduleId] = pending;
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Cannot load students'), 'error');
    }
    this.cdr.markForCheck();
  }

  pendingOf(scheduleId: number, tripId: number): { id: number; requestType: number } | undefined {
    return this.pendingBySchedule[scheduleId]?.[tripId];
  }

  isSending(scheduleId: number, tripId: number): boolean {
    return this.sendingInvite?.scheduleId === scheduleId && this.sendingInvite?.tripId === tripId;
  }

  async invite(scheduleId: number, tripId: number): Promise<void> {
    this.sendingInvite = { scheduleId, tripId };
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.travelService.sendRequest(scheduleId, tripId, 1));
      await this.loadSuggestions(scheduleId);
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed'), 'error');
    }
    this.sendingInvite = null;
    this.cdr.markForCheck();
  }

  async cancelInvite(matchRequestId: number, scheduleId: number): Promise<void> {
    try {
      await firstValueFrom(this.travelService.cancelRequest(matchRequestId));
      await this.loadSuggestions(scheduleId);
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed'), 'error');
    }
  }

  async accept(matchRequestId: number, scheduleId: number): Promise<void> {
    try {
      await firstValueFrom(this.travelService.acceptRequest(matchRequestId));
      this.fb.toast('Request accepted', 'success');
      this.load();
      await this.refreshPanels(scheduleId);
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed'), 'error');
    }
  }

  async reject(matchRequestId: number, scheduleId: number): Promise<void> {
    try {
      await firstValueFrom(this.travelService.rejectRequest(matchRequestId));
      await this.refreshPanels(scheduleId);
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed'), 'error');
    }
  }

  private async refreshPanels(scheduleId: number): Promise<void> {
    if (this.showRequestsFor === scheduleId) await this.loadRequests(scheduleId);
    if (this.showSuggestionsFor === scheduleId) await this.loadSuggestions(scheduleId);
  }

  // ---- Requests ----
  async toggleRequests(scheduleId: number): Promise<void> {
    if (this.showRequestsFor === scheduleId) {
      this.showRequestsFor = null;
      return;
    }
    await this.loadRequests(scheduleId);
    this.showRequestsFor = scheduleId;
    this.cdr.markForCheck();
  }

  private async loadRequests(scheduleId: number): Promise<void> {
    try {
      this.requestsBySchedule[scheduleId] = await firstValueFrom(this.travelService.getRequestsBySchedule(scheduleId));
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Cannot load requests'), 'error');
    }
    this.cdr.markForCheck();
  }
}
