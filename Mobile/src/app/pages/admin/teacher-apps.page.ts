import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { TeacherProfileService } from '@web/services/teacherProfile.service';
import { TeacherProfileDTO } from '@web/models/teacher-profile.model';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { AvatarComponent } from '../../ui/avatar.component';
import { BadgeComponent } from '../../ui/badge.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';
import { teacherStatusText } from './teacher-status';

/** 32 Teacher Applications — design-mobile/screens/TeacherApps.dc.html */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonRefresher, IonRefresherContent, RouterLink, AvatarComponent, BadgeComponent, LoadingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teacher-apps.page.html',
  styleUrls: ['./admin.css', './teacher-apps.page.css'],
  host: { class: 'bg-admin' },
})
export class TeacherAppsPage implements OnInit {
  private teacherService = inject(TeacherProfileService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly chips = [
    { value: -1, label: 'All' },
    { value: 1, label: 'Submitted' },
    { value: 2, label: 'Approved Admin' },
    { value: 3, label: 'Rejected Admin' },
    { value: 4, label: 'Approved Teacher' },
    { value: 5, label: 'Rejected Teacher' },
    { value: 6, label: 'Banned' },
  ];

  teachers: TeacherProfileDTO[] = [];
  loading = true;
  selectedStatus = -1;
  readonly statusText = teacherStatusText;

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(event?: CustomEvent): void {
    if (!event) {
      this.loading = true;
      this.cdr.markForCheck();
    }
    const req =
      this.selectedStatus === -1 ? this.teacherService.getAllTeachers() : this.teacherService.getAllTeachers(this.selectedStatus);
    req.subscribe({
      next: (res) => {
        this.teachers = res || [];
        this.loading = false;
        this.cdr.markForCheck();
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
      error: (err) => {
        this.teachers = [];
        this.loading = false;
        this.fb.toast(errorMessage(err, 'Could not load teacher profiles'), 'error');
        this.cdr.markForCheck();
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
    });
  }

  setStatusFilter(status: number): void {
    if (status === this.selectedStatus) return;
    this.selectedStatus = status;
    this.loadTeachers();
  }

  avatar(t: TeacherProfileDTO): string {
    return mediaUrl(t.avatarUrl, 'uploads');
  }

  money(v: number | null | undefined): string {
    return v ? `$${v}` : '—';
  }
}
