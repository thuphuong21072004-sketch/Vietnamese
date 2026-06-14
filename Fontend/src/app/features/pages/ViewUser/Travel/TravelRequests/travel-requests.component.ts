import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TravelService } from '../../../../services/travel.service';
import { MatchRequestDto } from '../../../../models/travel.model';

@Component({
  selector: 'app-user-travel-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './travel-requests.component.html',
  styleUrls: ['./travel-requests.component.css'],
})
export class UserTravelRequestsComponent implements OnInit {
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

  loadAll(): void {
    this.loading = true;
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

  // requestType 0 = StudentInvite (you/student sent) → you can cancel
  youSent(req: MatchRequestDto): boolean {
    return req.requestType === 0;
  }

  accept(id: number): void {
    this.travelService.acceptRequest(id).subscribe({
      next: () => this.loadAll(),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  reject(id: number): void {
    this.travelService.rejectRequest(id).subscribe({
      next: () => this.loadAll(),
      error: (err) => alert(err.error?.message || 'Failed'),
    });
  }

  cancel(id: number): void {
    this.travelService.cancelRequest(id).subscribe({
      next: () => this.loadAll(),
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
    return requestType === 0 ? 'You invited teacher' : 'Teacher invited you';
  }
}
