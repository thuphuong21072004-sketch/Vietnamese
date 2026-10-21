import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TravelService } from '@web/services/travel.service';
import { MatchRequestDto, StudentTripDto, TeacherScheduleDto, TravelBookingDto } from '@web/models/travel.model';
import { FeedbackService } from '../../../core/feedback.service';
import { errorMessage } from '../../../core/errors';
import { mediaUrl } from '../../../core/media';
import { NavBarComponent } from '../../../ui/nav-bar.component';
import { AvatarComponent } from '../../../ui/avatar.component';
import { IconComponent, ICONS } from '../../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../../ui/states.component';
import { T_ICONS, dmy } from '../teacher.utils';
import { TeacherTravelTabsComponent } from './travel-tabs.component';

/** Students Looking for a Teacher — chưa có design, dựng theo ui-spec §3.3 */
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
    IconComponent,
    EmptyStateComponent,
    LoadingComponent,
    TeacherTravelTabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'bg-travel' },
  templateUrl: './open-trips.page.html',
  styleUrls: ['../teacher-shared.css', './travel.css', './open-trips.page.css'],
})
export class TeacherOpenTripsPage implements OnInit {
  private travelService = inject(TravelService);
  private fb = inject(FeedbackService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = { ...T_ICONS, pin: ICONS.pin, search: ICONS.search };
  readonly dmy = dmy;

  trips: StudentTripDto[] = [];
  mySchedules: TeacherScheduleDto[] = [];
  outgoing: MatchRequestDto[] = [];
  confirmedBookings: TravelBookingDto[] = [];
  reservedByTrip: Record<number, number> = {};

  loading = true;
  filterDestination = '';
  /** Điểm đến đã áp dụng (hiện trong câu rỗng). */
  appliedDestination = '';
  sendingTripId: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  async load(event?: CustomEvent, silent = false): Promise<void> {
    this.loading = !event && !silent;
    this.appliedDestination = this.filterDestination.trim();
    this.cdr.markForCheck();
    try {
      const res = await firstValueFrom(
        forkJoin({
          trips: this.travelService.getOpenStudentTrips(this.appliedDestination || undefined),
          schedules: this.travelService.getMySchedules().pipe(catchError(() => of([] as TeacherScheduleDto[]))),
          outgoing: this.travelService.getOutgoingRequests().pipe(catchError(() => of([] as MatchRequestDto[]))),
          bookings: this.travelService.getMyConfirmedBookings().pipe(catchError(() => of([] as TravelBookingDto[]))),
          classMap: this.travelService.getMyReservedClassMap().pipe(catchError(() => of({} as Record<number, number>))),
        }),
      );
      this.trips = res.trips;
      this.mySchedules = res.schedules;
      this.outgoing = res.outgoing;
      this.confirmedBookings = res.bookings;
      this.reservedByTrip = res.classMap;
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Cannot load trips'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  clear(): void {
    this.filterDestination = '';
    this.load();
  }

  avatar(file: string | null | undefined): string {
    return mediaUrl(file, 'uploads');
  }

  /** Lịch rảnh phù hợp: cùng điểm đến, phủ trọn ngày chuyến đi, không trùng chuyến đã chốt. */
  matchingSchedule(trip: StudentTripDto): TeacherScheduleDto | null {
    return (
      this.mySchedules.find((s) => {
        if (
          s.destination.toLowerCase() !== trip.destination.toLowerCase() ||
          s.availableFrom > trip.startDate ||
          s.availableTo < trip.endDate
        )
          return false;
        const conflict = this.confirmedBookings.some((b) => b.startDate <= trip.endDate && b.endDate >= trip.startDate);
        return !conflict;
      }) ?? null
    );
  }

  sentRequest(trip: StudentTripDto): MatchRequestDto | null {
    return this.outgoing.find((r) => r.tripId === trip.tripId) ?? null;
  }

  /** Chỉ được tạo lớp cho chuyến đã đăng ≥ 10 ngày. */
  canCreateClass(trip: StudentTripDto): boolean {
    const tenDaysLater = new Date(trip.createdAt);
    tenDaysLater.setDate(tenDaysLater.getDate() + 10);
    return new Date() >= tenDaysLater;
  }

  createClass(trip: StudentTripDto): void {
    this.router.navigate(['/teacher/classes/new'], {
      queryParams: {
        province: trip.destination,
        specificLocation: trip.specificLocation ?? '',
        tripStartDate: trip.startDate?.substring(0, 10),
        tripId: trip.tripId,
      },
    });
  }

  async invite(trip: StudentTripDto): Promise<void> {
    const schedule = this.matchingSchedule(trip);
    if (!schedule) return;
    this.sendingTripId = trip.tripId;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.travelService.sendRequest(schedule.scheduleId, trip.tripId, 1));
      this.fb.toast('Invite sent', 'success');
      await this.load(undefined, true);
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to send invite'), 'error');
    }
    this.sendingTripId = null;
    this.cdr.markForCheck();
  }

  async cancelInvite(req: MatchRequestDto): Promise<void> {
    const ok = await this.fb.confirm({ header: 'Cancel this invite?', okText: 'Cancel Invite', cancelText: 'Keep', danger: true });
    if (!ok) return;
    try {
      await firstValueFrom(this.travelService.cancelRequest(req.matchRequestId));
      await this.load(undefined, true);
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to cancel'), 'error');
    }
  }
}
