import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TravelService } from '../../../../services/travel.service';
import { StudentTripDto, TeacherScheduleDto } from '../../../../models/travel.model';
import { TeacherClassDto } from '../../../../models/teacher-class.model';
import { VIETNAM_DESTINATIONS, DestinationGroup } from '../../../../models/vietnam-destinations';

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-trips.component.html',
  styleUrls: ['./my-trips.component.css'],
})
export class MyTripsComponent implements OnInit {
  trips: StudentTripDto[] = [];
  loading = false;
  saving = false;

  showForm = false;
  editingTripId: number | null = null;
  form = { destination: '', specificLocation: '', phoneNumber: '', startDate: '', endDate: '' };

  readonly destinationGroups: DestinationGroup[] = VIETNAM_DESTINATIONS;
  selectedProvince = '';
  selectedSpot = '';

  get availableSpots(): string[] {
    return this.destinationGroups.find(g => g.province === this.selectedProvince)?.spots ?? [];
  }

  get minStartDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }

  onProvinceChange(): void {
    this.form.destination = this.selectedProvince;
    this.selectedSpot = '';
    this.form.specificLocation = '';
  }

  onSpotChange(): void {
    this.form.specificLocation = this.selectedSpot;
  }

  filterStatus: string = '';
  filterFrom: string = '';
  filterTo: string = '';

  get filtered(): StudentTripDto[] {
    return this.trips.filter(t => {
      if (this.filterStatus !== '' && t.status !== +this.filterStatus) return false;
      if (this.filterFrom && t.startDate < this.filterFrom) return false;
      if (this.filterTo && t.endDate > this.filterTo) return false;
      return true;
    });
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterFrom = '';
    this.filterTo = '';
  }

  suggestions: Record<number, TeacherScheduleDto[] | undefined> = {};
  pendingByTrip: Record<number, Record<number, { id: number; requestType: number }>> = {};
  loadingSuggestionsFor: number | null = null;
  showSuggestionsFor: number | null = null;
  sendingInvite: { scheduleId: number; tripId: number } | null = null;

  reservedClasses: Record<number, TeacherClassDto[]> = {};
  showClassesFor: number | null = null;
  loadingClassesFor: number | null = null;

  constructor(private travelService: TravelService) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.loading = true;
    this.travelService.getMyTrips().subscribe({
      next: (data) => { this.trips = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openCreate(): void {
    this.form = { destination: '', specificLocation: '', phoneNumber: '', startDate: '', endDate: '' };
    this.selectedProvince = '';
    this.selectedSpot = '';
    this.editingTripId = null;
    this.showForm = true;
  }

  openEdit(trip: StudentTripDto): void {
    this.form = { destination: trip.destination, specificLocation: trip.specificLocation ?? '', phoneNumber: trip.phoneNumber ?? '', startDate: trip.startDate, endDate: trip.endDate };
    this.selectedProvince = trip.destination;
    this.selectedSpot = trip.specificLocation ?? '';
    this.editingTripId = trip.tripId;
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingTripId = null;
  }

  save(): void {
    if (!this.form.destination.trim() || !this.form.startDate || !this.form.endDate) return;
    if (this.form.startDate > this.form.endDate) {
      alert('Start date must be before end date');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minStart = new Date(today);
    minStart.setDate(minStart.getDate() + 30);
    const start = new Date(this.form.startDate);
    if (start < minStart) {
      alert('Start date must be at least 30 days from today');
      return;
    }
    this.saving = true;
    const obs$ = this.editingTripId
      ? this.travelService.updateTrip(this.editingTripId, this.form)
      : this.travelService.createTrip(this.form);
    obs$.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.loadTrips(); },
      error: (err) => { this.saving = false; alert(err.error?.message || 'Failed'); },
    });
  }

  deleteTrip(tripId: number): void {
    if (!confirm('Delete this trip?')) return;
    this.travelService.deleteTrip(tripId).subscribe({
      next: () => this.loadTrips(),
      error: (err) => alert(err.error?.message || 'Cannot delete trip'),
    });
  }

  findTeachers(tripId: number): void {
    if (this.showSuggestionsFor === tripId) {
      this.showSuggestionsFor = null;
      return;
    }
    this.loadingSuggestionsFor = tripId;
    this.loadSuggestions(tripId, () => { this.loadingSuggestionsFor = null; });
  }

  private loadSuggestions(tripId: number, done?: () => void): void {
    forkJoin({
      teachers: this.travelService.getSuggestedTeachers(tripId),
      requests: this.travelService.getRequestsByTrip(tripId),
    }).subscribe({
      next: ({ teachers, requests }) => {
        this.suggestions[tripId] = teachers;
        this.showSuggestionsFor = tripId;
        const pending: Record<number, { id: number; requestType: number }> = {};
        requests.filter(r => r.status === 0).forEach(r => {
          pending[r.scheduleId] = { id: r.matchRequestId, requestType: r.requestType };
        });
        this.pendingByTrip[tripId] = pending;
        done?.();
      },
      error: () => { done?.(); },
    });
  }

  getPendingRequest(tripId: number, scheduleId: number): { id: number; requestType: number } | undefined {
    return this.pendingByTrip[tripId]?.[scheduleId];
  }

  accept(matchRequestId: number): void {
    this.travelService.acceptRequest(matchRequestId).subscribe({
      next: () => this.loadTrips(),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  reject(matchRequestId: number, tripId: number): void {
    this.travelService.rejectRequest(matchRequestId).subscribe({
      next: () => this.loadSuggestions(tripId),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  sendInvite(scheduleId: number, tripId: number): void {
    this.sendingInvite = { scheduleId, tripId };
    this.travelService.sendRequest(scheduleId, tripId, 0).subscribe({
      next: () => { this.sendingInvite = null; this.loadSuggestions(tripId); },
      error: (err) => { this.sendingInvite = null; alert(err.error?.message || 'Failed'); },
    });
  }

  cancelInvite(matchRequestId: number, tripId: number): void {
    this.travelService.cancelRequest(matchRequestId).subscribe({
      next: () => this.loadSuggestions(tripId),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  isSendingInvite(scheduleId: number, tripId: number): boolean {
    return this.sendingInvite?.scheduleId === scheduleId && this.sendingInvite?.tripId === tripId;
  }

  viewReservedClasses(tripId: number): void {
    if (this.showClassesFor === tripId) {
      this.showClassesFor = null;
      return;
    }
    this.loadingClassesFor = tripId;
    this.travelService.getReservedClassesForTrip(tripId).subscribe({
      next: (classes) => {
        this.reservedClasses[tripId] = classes;
        this.showClassesFor = tripId;
        this.loadingClassesFor = null;
      },
      error: () => { this.loadingClassesFor = null; },
    });
  }

  statusLabel(status: number): string {
    const map: Record<number, string> = { 0: 'Finding Teacher', 1: 'Matched', 2: 'Cancelled' };
    return map[status] ?? '';
  }

  statusClass(status: number): string {
    const map: Record<number, string> = { 0: 'finding', 1: 'matched', 2: 'cancelled' };
    return map[status] ?? '';
  }
}
