import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TravelService } from '../../../../services/travel.service';
import { TeacherScheduleDto, StudentTripDto } from '../../../../models/travel.model';
import { VIETNAM_DESTINATIONS, DestinationGroup } from '../../../../models/vietnam-destinations';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-my-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-schedules.component.html',
  styleUrls: ['./my-schedules.component.css'],
})
export class MySchedulesComponent implements OnInit {
  serverUrl = environment.serverUrl;

  schedules: TeacherScheduleDto[] = [];
  loading = false;
  saving = false;

  showForm = false;
  editingScheduleId: number | null = null;
  form = { destination: '', availableFrom: '', availableTo: '', status: 1 };

  readonly destinationGroups: DestinationGroup[] = VIETNAM_DESTINATIONS;
  selectedProvince = '';

  onProvinceChange(): void {
    this.form.destination = this.selectedProvince;
  }

  suggestions: Record<number, StudentTripDto[] | undefined> = {};
  pendingBySchedule: Record<number, Record<number, { id: number; requestType: number }>> = {};
  loadingSuggestionsFor: number | null = null;
  showSuggestionsFor: number | null = null;
  sendingInvite: { scheduleId: number; tripId: number } | null = null;

  showRequestsFor: number | null = null;
  requestsBySchedule: Record<number, any[] | undefined> = {};

  constructor(private travelService: TravelService) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    this.loading = true;
    this.travelService.getMySchedules().subscribe({
      next: (data) => { this.schedules = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openCreate(): void {
    this.form = { destination: '', availableFrom: '', availableTo: '', status: 1 };
    this.selectedProvince = '';
    this.editingScheduleId = null;
    this.showForm = true;
  }

  openEdit(s: TeacherScheduleDto): void {
    this.form = {
      destination: s.destination,
      availableFrom: s.availableFrom,
      availableTo: s.availableTo,
      status: s.status,
    };
    this.selectedProvince = s.destination;
    this.editingScheduleId = s.scheduleId;
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingScheduleId = null;
  }

  save(): void {
    if (!this.form.destination.trim() || !this.form.availableFrom || !this.form.availableTo) return;
    this.saving = true;
    const obs$ = this.editingScheduleId
      ? this.travelService.updateSchedule(this.editingScheduleId, this.form)
      : this.travelService.createSchedule(this.form);
    obs$.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.loadSchedules(); },
      error: (err) => { this.saving = false; alert(err.error?.message || 'Failed'); },
    });
  }

  deleteSchedule(id: number): void {
    if (!confirm('Delete this schedule?')) return;
    this.travelService.deleteSchedule(id).subscribe({
      next: () => this.loadSchedules(),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  closeSchedule(s: TeacherScheduleDto): void {
    if (!confirm('Close this schedule? It will no longer appear in matches.')) return;
    this.travelService.updateSchedule(s.scheduleId, { ...s, status: 0 }).subscribe({
      next: () => this.loadSchedules(),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  reopenSchedule(s: TeacherScheduleDto): void {
    this.travelService.updateSchedule(s.scheduleId, { ...s, status: 1 }).subscribe({
      next: () => this.loadSchedules(),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  findStudents(scheduleId: number): void {
    if (this.showSuggestionsFor === scheduleId) {
      this.showSuggestionsFor = null;
      return;
    }
    this.loadingSuggestionsFor = scheduleId;
    this.loadSuggestions(scheduleId, () => { this.loadingSuggestionsFor = null; });
  }

  private loadSuggestions(scheduleId: number, done?: () => void): void {
    forkJoin({
      students: this.travelService.getSuggestedStudents(scheduleId),
      requests: this.travelService.getRequestsBySchedule(scheduleId),
    }).subscribe({
      next: ({ students, requests }) => {
        this.suggestions[scheduleId] = students;
        this.showSuggestionsFor = scheduleId;
        const pending: Record<number, { id: number; requestType: number }> = {};
        requests.filter(r => r.status === 0).forEach(r => {
          pending[r.tripId] = { id: r.matchRequestId, requestType: r.requestType };
        });
        this.pendingBySchedule[scheduleId] = pending;
        done?.();
      },
      error: () => { done?.(); },
    });
  }

  getPendingRequest(scheduleId: number, tripId: number): { id: number; requestType: number } | undefined {
    return this.pendingBySchedule[scheduleId]?.[tripId];
  }

  sendInvite(scheduleId: number, tripId: number): void {
    this.sendingInvite = { scheduleId, tripId };
    this.travelService.sendRequest(scheduleId, tripId, 1).subscribe({
      next: () => { this.sendingInvite = null; this.loadSuggestions(scheduleId); },
      error: (err) => { this.sendingInvite = null; alert(err.error?.message || 'Failed'); },
    });
  }

  cancelInvite(matchRequestId: number, scheduleId: number): void {
    this.travelService.cancelRequest(matchRequestId).subscribe({
      next: () => this.loadSuggestions(scheduleId),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  accept(matchRequestId: number, scheduleId: number): void {
    this.travelService.acceptRequest(matchRequestId).subscribe({
      next: () => {
        this.loadSchedules();
        this.travelService.getRequestsBySchedule(scheduleId).subscribe(data => { this.requestsBySchedule[scheduleId] = data; });
      },
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  reject(matchRequestId: number, scheduleId: number): void {
    this.travelService.rejectRequest(matchRequestId).subscribe({
      next: () => {
        this.travelService.getRequestsBySchedule(scheduleId).subscribe(data => { this.requestsBySchedule[scheduleId] = data; });
      },
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  toggleRequests(scheduleId: number): void {
    if (this.showRequestsFor === scheduleId) {
      this.showRequestsFor = null;
      return;
    }
    this.travelService.getRequestsBySchedule(scheduleId).subscribe({
      next: (data) => {
        this.requestsBySchedule[scheduleId] = data;
        this.showRequestsFor = scheduleId;
      },
    });
  }

  requestStatusLabel(status: number): string {
    const map: Record<number, string> = { 0: 'Pending', 1: 'Accepted', 2: 'Rejected', 3: 'Cancelled' };
    return map[status] ?? '';
  }

  requestStatusClass(status: number): string {
    const map: Record<number, string> = { 0: 'pending', 1: 'accepted', 2: 'rejected', 3: 'cancelled' };
    return map[status] ?? '';
  }

  isSendingInvite(scheduleId: number, tripId: number): boolean {
    return this.sendingInvite?.scheduleId === scheduleId && this.sendingInvite?.tripId === tripId;
  }

  statusLabel(status: number): string {
    return status === 1 ? 'Open' : 'Closed';
  }

  statusClass(status: number): string {
    return status === 1 ? 'open' : 'closed';
  }

  tripStatusLabel(status: number): string {
    const map: Record<number, string> = { 0: 'Finding Teacher', 1: 'Matched', 2: 'Cancelled' };
    return map[status] ?? '';
  }
}
