import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TravelService } from '../../../../services/travel.service';
import { MatchRequestDto } from '../../../../models/travel.model';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-teacher-travel-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './travel-requests.component.html',
  styleUrls: ['./travel-requests.component.css'],
})
export class TeacherTravelRequestsComponent implements OnInit {
  serverUrl = environment.serverUrl;

  requests: MatchRequestDto[] = [];
  loading = false;

  filterStatus: string = '';
  filterFrom: string = '';
  filterTo: string = '';

  get filtered(): MatchRequestDto[] {
    return this.requests.filter(r => {
      if (this.filterStatus !== '' && r.status !== +this.filterStatus) return false;
      if (this.filterFrom && r.startDate < this.filterFrom) return false;
      if (this.filterTo && r.endDate > this.filterTo) return false;
      return true;
    });
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterFrom = '';
    this.filterTo = '';
  }

  constructor(private travelService: TravelService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(silent = false): void {
    if (!silent) this.loading = true;
    Promise.all([
      this.travelService.getIncomingRequests().toPromise(),
      this.travelService.getOutgoingRequests().toPromise(),
    ]).then(([inc, out]) => {
      const seen = new Set<number>();
      const all = [...(inc ?? []), ...(out ?? [])].filter(r => {
        if (seen.has(r.matchRequestId)) return false;
        seen.add(r.matchRequestId);
        return true;
      });
      all.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      this.requests = all;
      this.loading = false;
    }).catch(() => { this.loading = false; });
  }

  // requestType 1 = TeacherInvite (you/teacher sent) → you can cancel
  iYouSent(req: MatchRequestDto): boolean {
    return req.requestType === 1;
  }

  accept(id: number): void {
    this.travelService.acceptRequest(id).subscribe({
      next: () => this.loadAll(true),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  reject(id: number): void {
    this.travelService.rejectRequest(id).subscribe({
      next: () => this.loadAll(true),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  cancel(id: number): void {
    this.travelService.cancelRequest(id).subscribe({
      next: () => this.loadAll(true),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  statusLabel(status: number): string {
    const map: Record<number, string> = { 0: 'Pending', 1: 'Accepted', 2: 'Rejected', 3: 'Cancelled' };
    return map[status] ?? '';
  }

  statusClass(status: number): string {
    const map: Record<number, string> = { 0: 'pending', 1: 'accepted', 2: 'rejected', 3: 'cancelled' };
    return map[status] ?? '';
  }

  typeLabel(requestType: number): string {
    return requestType === 1 ? 'You invited student' : 'Student invited you';
  }
}
