import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { TeacherAvailabilityService } from '@web/services/teacher-availability.service';
import { FeedbackService } from '../../../core/feedback.service';
import { errorMessage } from '../../../core/errors';
import { IconComponent } from '../../../ui/icon.component';
import { BadgeComponent } from '../../../ui/badge.component';
import { EmptyStateComponent, LoadingComponent } from '../../../ui/states.component';
import { T_ICONS } from '../teacher.utils';

/** 28 My Availability — design-mobile/screens/Availability.dc.html */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    FormsModule,
    DatePipe,
    IconComponent,
    BadgeComponent,
    EmptyStateComponent,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './availability.page.html',
  styleUrls: ['../teacher-shared.css', './availability.page.css'],
})
export class AvailabilityPage implements OnInit {
  private scheduleService = inject(TeacherAvailabilityService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild(IonContent) content?: IonContent;

  readonly icons = T_ICONS;
  readonly statusChips = [
    { value: '', label: 'All' },
    { value: '0', label: 'Available' },
    { value: '1', label: 'Booked' },
    { value: '2', label: 'Expired' },
  ];

  schedules: any[] = [];
  loading = true;
  saving = false;
  selectedDate = '';
  selectedStatus = '';
  form = { startTime: '', endTime: '' };
  editingId: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  async load(event?: CustomEvent): Promise<void> {
    this.loading = !event;
    this.cdr.markForCheck();
    const status = this.selectedStatus !== '' ? Number(this.selectedStatus) : undefined;
    try {
      this.schedules = (await firstValueFrom(this.scheduleService.getMySchedules(status, this.selectedDate))) ?? [];
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Cannot load schedules'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  setStatus(v: string): void {
    this.selectedStatus = v;
    this.load();
  }

  clearDate(): void {
    this.selectedDate = '';
    this.load();
  }

  statusText(status: number): string {
    return status === 0 ? 'Available' : status === 1 ? 'Booked' : 'Expired';
  }

  async save(): Promise<void> {
    if (!this.form.startTime || !this.form.endTime) {
      this.fb.toast('Please select time', 'error');
      return;
    }
    // ô datetime-local là giờ máy, backend lưu UTC → đổi sang ISO UTC
    const payload = { startTime: new Date(this.form.startTime).toISOString(), endTime: new Date(this.form.endTime).toISOString() };
    const editing = this.editingId;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(editing ? this.scheduleService.update(editing, payload) : this.scheduleService.create(payload));
      this.fb.toast(editing ? 'Schedule updated' : 'Schedule created', 'success');
      this.resetForm();
      this.load();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Operation failed'), 'error');
    }
    this.saving = false;
    this.cdr.markForCheck();
  }

  edit(item: any): void {
    if (item.status !== 0) return;
    this.editingId = item.availabilityId;
    this.form = { startTime: this.toLocalInput(item.startTime), endTime: this.toLocalInput(item.endTime) };
    this.content?.scrollToTop(300);
    this.cdr.markForCheck();
  }

  async remove(item: any): Promise<void> {
    if (item.status !== 0) return;
    const ok = await this.fb.confirm({ header: 'Delete this schedule?', okText: 'Delete', danger: true });
    if (!ok) return;
    try {
      await firstValueFrom(this.scheduleService.delete(item.availabilityId));
      this.fb.toast('Deleted successfully', 'success');
      if (this.editingId === item.availabilityId) this.resetForm();
      this.load();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Delete failed'), 'error');
    }
  }

  resetForm(): void {
    this.editingId = null;
    this.form = { startTime: '', endTime: '' };
    this.cdr.markForCheck();
  }

  /** ISO UTC → "yyyy-MM-ddTHH:mm" giờ máy cho datetime-local */
  private toLocalInput(utc: string | null | undefined): string {
    if (!utc) return '';
    const d = new Date(utc);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
