import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { TravelService } from '@web/services/travel.service';
import { TravelBookingAdminDto } from '@web/models/travel.model';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { isNative, saveAndShareNativeFile } from '../../core/native-file';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';

/**
 * Confirmed Travel Bookings (chưa có design — dựng theo ui-spec §3.4)
 * Export Excel: thư viện xlsx giống web; trong app Android/iOS lưu file + mở bảng Chia sẻ (core/native-file.ts).
 */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonRefresher, IonRefresherContent, FormsModule, DatePipe, NavBarComponent, IconComponent, LoadingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './travel-bookings.page.html',
  styleUrls: ['./admin.css', './travel-bookings.page.css'],
  host: { class: 'bg-admin' },
})
export class TravelBookingsPage implements OnInit {
  private travelService = inject(TravelService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = ICONS;
  readonly downloadIcon = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3';
  readonly mailIcon = 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6';
  readonly phoneIcon =
    'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z';

  bookings: TravelBookingAdminDto[] = [];
  loading = true;
  filterDate = '';

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    if (!event) {
      this.loading = true;
      this.cdr.markForCheck();
    }
    const d = this.filterDate || undefined;
    this.travelService.getAllBookingsAdmin(d, d).subscribe({
      next: (data) => {
        this.bookings = this.sortBookings(data || []);
        this.loading = false;
        this.cdr.markForCheck();
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
      error: (err) => {
        this.loading = false;
        this.fb.toast(errorMessage(err, 'Could not load travel bookings'), 'error');
        this.cdr.markForCheck();
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
    });
  }

  clearFilter(): void {
    this.filterDate = '';
    this.load();
  }

  /** Giống web: chuyến gần/tương lai lên trước (tăng dần), chuyến cũ sau (gần nhất trước). */
  private sortBookings(list: TravelBookingAdminDto[]): TravelBookingAdminDto[] {
    const now = new Date();
    const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayMs = todayMs - 86400000;
    const toMs = (s: string) => {
      const p = (s || '').substring(0, 10).split('-').map(Number);
      return Date.UTC(p[0], p[1] - 1, p[2]);
    };
    return [...list].sort((a, b) => {
      const aMs = toMs(a.startDate);
      const bMs = toMs(b.startDate);
      const aRecent = aMs >= yesterdayMs;
      const bRecent = bMs >= yesterdayMs;
      if (aRecent && bRecent) return aMs - bMs;
      if (aRecent) return -1;
      if (bRecent) return 1;
      return bMs - aMs;
    });
  }

  exporting = false;

  /** Xuất Excel (.xlsx) — cùng cột, độ rộng và tên file với web (thư viện xlsx, nạp khi bấm nút). */
  async exportExcel(): Promise<void> {
    if (!this.bookings.length || this.exporting) return;
    this.exporting = true;
    this.cdr.markForCheck();
    try {
      const XLSX = await import('xlsx');
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
      ws['!cols'] = [
        { wch: 4 }, { wch: 20 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
        { wch: 22 }, { wch: 28 }, { wch: 15 },
        { wch: 22 }, { wch: 28 }, { wch: 15 }, { wch: 14 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Travel Bookings');
      const fileName = `travel-bookings${this.filterDate ? '-' + this.filterDate : ''}.xlsx`;
      if (isNative()) {
        // App Android/iOS: WebView không tải file được → lưu vào bộ nhớ app rồi mở bảng Chia sẻ (Zalo, Drive, Gmail…)
        const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        await saveAndShareNativeFile(fileName, base64, 'Travel Bookings');
      } else {
        XLSX.writeFile(wb, fileName);
      }
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Export failed'), 'error');
    } finally {
      this.exporting = false;
      this.cdr.markForCheck();
    }
  }
}
