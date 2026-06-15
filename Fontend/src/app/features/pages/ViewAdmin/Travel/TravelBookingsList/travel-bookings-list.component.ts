import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { TravelService } from '../../../../services/travel.service';
import { TravelBookingAdminDto } from '../../../../models/travel.model';

@Component({
  selector: 'app-travel-bookings-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './travel-bookings-list.component.html',
  styleUrls: ['./travel-bookings-list.component.css'],
})
export class TravelBookingsListComponent implements OnInit {
  bookings: TravelBookingAdminDto[] = [];
  loading = false;
  filterDate = '';

  constructor(private travelService: TravelService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const d = this.filterDate || undefined;
    this.travelService.getAllBookingsAdmin(d, d).subscribe({
      next: (data) => {
        this.bookings = this.sortBookings(data);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  clearFilter(): void {
    this.filterDate = '';
    this.load();
  }

  private sortBookings(list: TravelBookingAdminDto[]): TravelBookingAdminDto[] {
    const now = new Date();
    const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayMs = todayMs - 86400000;

    return [...list].sort((a, b) => {
      const toMs = (s: string) => {
        const p = s.substring(0, 10).split('-').map(Number);
        return Date.UTC(p[0], p[1] - 1, p[2]);
      };
      const aMs = toMs(a.startDate);
      const bMs = toMs(b.startDate);
      const aRecent = aMs >= yesterdayMs;
      const bRecent = bMs >= yesterdayMs;
      if (aRecent && bRecent) return aMs - bMs;  // cả hai gần/tương lai: tăng dần
      if (aRecent) return -1;                     // a gần, b xa quá khứ: a lên đầu
      if (bRecent) return 1;
      return bMs - aMs;                           // cả hai quá khứ xa: gần nhất trước
    });
  }

  exportExcel(): void {
    const rows = this.bookings.map((b, i) => ({
      '#': i + 1,
      'Destination': b.destination,
      'Specific Location': b.specificLocation ?? '',
      'Start Date': b.startDate,
      'End Date': b.endDate,
      'Teacher Name': b.teacherName,
      'Teacher Email': b.teacherEmail ?? '',
      'Teacher Phone': b.teacherPhone ?? '',
      'Student Name': b.studentName,
      'Student Email': b.studentEmail ?? '',
      'Student Phone': b.studentPhone ?? '',
      'Confirmed At': new Date(b.createdAt).toLocaleDateString('vi-VN'),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Travel Bookings');

    const colWidths = [
      { wch: 4 }, { wch: 20 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
      { wch: 22 }, { wch: 28 }, { wch: 15 },
      { wch: 22 }, { wch: 28 }, { wch: 15 }, { wch: 14 },
    ];
    ws['!cols'] = colWidths;

    const fileName = `travel-bookings${this.filterDate ? '-' + this.filterDate : ''}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}
