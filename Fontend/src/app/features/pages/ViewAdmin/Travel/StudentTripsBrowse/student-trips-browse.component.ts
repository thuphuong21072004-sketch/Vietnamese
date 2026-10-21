import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { TravelService } from '../../../../services/travel.service';
import { StudentTripDto, TeacherScheduleDto, MatchRequestDto, TravelBookingDto } from '../../../../models/travel.model';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-student-trips-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './student-trips-browse.component.html',
  styleUrls: ['./student-trips-browse.component.css'],
})
export class StudentTripsBrowseComponent implements OnInit {
  serverUrl = environment.serverUrl;

  trips: StudentTripDto[] = [];
  mySchedules: TeacherScheduleDto[] = [];
  outgoingRequests: MatchRequestDto[] = [];
  myConfirmedBookings: TravelBookingDto[] = [];
  myReservedByTrip: Record<number, number> = {};

  loading = false;
  filterDestination = '';
  sendingTripId: number | null = null;

  constructor(private travelService: TravelService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      trips: this.travelService.getOpenStudentTrips(this.filterDestination || undefined),
      schedules: this.travelService.getMySchedules().pipe(catchError(() => of([]))),
      outgoing: this.travelService.getOutgoingRequests().pipe(catchError(() => of([]))),
      bookings: this.travelService.getMyConfirmedBookings().pipe(catchError(() => of([]))),
      classMap: this.travelService.getMyReservedClassMap().pipe(catchError(() => of({}))),
    }).subscribe({
      next: ({ trips, schedules, outgoing, bookings, classMap }) => {
        this.trips = trips;
        this.mySchedules = schedules;
        this.outgoingRequests = outgoing;
        this.myConfirmedBookings = bookings;
        this.myReservedByTrip = classMap;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  clearFilter(): void {
    this.filterDestination = '';
    this.load();
  }

  // Tìm schedule phù hợp (cùng destination, trip nằm trong khoảng, không trùng lịch đã chốt)
  matchingSchedule(trip: StudentTripDto): TeacherScheduleDto | null {
    return this.mySchedules.find(s => {
      // 1. Cùng điểm đến và ngày nằm trong khoảng schedule
      if (
        s.destination.toLowerCase() !== trip.destination.toLowerCase() ||
        s.availableFrom > trip.startDate ||
        s.availableTo < trip.endDate
      ) return false;

      // 2. Giáo viên không có confirmed booking nào trùng ngày (bất kể schedule nào)
      const hasConflict = this.myConfirmedBookings.some(b =>
        b.startDate <= trip.endDate &&
        b.endDate >= trip.startDate
      );
      return !hasConflict;
    }) ?? null;
  }

  // Kiểm tra đã gửi invite chưa
  sentRequest(trip: StudentTripDto): MatchRequestDto | null {
    return this.outgoingRequests.find(r => r.tripId === trip.tripId) ?? null;
  }

  sendInvite(trip: StudentTripDto): void {
    const schedule = this.matchingSchedule(trip);
    if (!schedule) return;
    this.sendingTripId = trip.tripId;
    this.travelService.sendRequest(schedule.scheduleId, trip.tripId, 1).subscribe({
      next: () => {
        this.sendingTripId = null;
        this.load();
      },
      error: (err) => {
        this.sendingTripId = null;
        alert(err.error?.message || 'Failed to send invite');
      },
    });
  }

  canCreateClass(trip: StudentTripDto): boolean {
    const created = new Date(trip.createdAt);
    const tenDaysLater = new Date(created);
    tenDaysLater.setDate(tenDaysLater.getDate() + 10);
    return new Date() >= tenDaysLater;
  }

  createClass(trip: StudentTripDto): void {
    this.router.navigate(['/class/create'], {
      queryParams: {
        province: trip.destination,
        specificLocation: trip.specificLocation ?? '',
        tripStartDate: trip.startDate,
        tripId: trip.tripId,
      },
    });
  }

  cancelInvite(requestId: number): void {
    this.travelService.cancelRequest(requestId).subscribe({
      next: () => this.load(),
      error: (err) => alert(err.error?.message || 'Failed to cancel'),
    });
  }

  formatDate(d: string): string {
    const [y, m, day] = d.substring(0, 10).split('-');
    return `${day}/${m}/${y}`;
  }
}
