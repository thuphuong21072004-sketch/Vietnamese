import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonFooter, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { Observable, firstValueFrom } from 'rxjs';
import { TeacherProfileService } from '@web/services/teacherProfile.service';
import { AuthService } from '../../core/auth.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { BadgeComponent } from '../../ui/badge.component';
import { LoadingComponent } from '../../ui/states.component';

type AlertTone = 'info' | 'warning' | 'success' | 'danger';

/** Nhãn badge + hộp thông báo theo trạng thái hồ sơ (0–6), màu theo ui-spec §4.6. */
const STATUS: Record<number, { label: string; text: string; tone: AlertTone }> = {
  0: { label: 'Draft', text: 'Complete your information and submit for review.', tone: 'info' },
  1: { label: 'Submitted', text: 'Your profile has been submitted and is waiting for admin review.', tone: 'warning' },
  2: {
    label: 'Approved By Admin',
    text: 'Admin approved your profile and proposed a teaching price. Please accept or reject.',
    tone: 'success',
  },
  3: { label: 'Rejected By Admin', text: 'Admin rejected your profile. Please update your information and submit again.', tone: 'danger' },
  4: { label: 'Approved Teacher', text: 'Congratulations! You are now an approved teacher.', tone: 'success' },
  5: { label: 'Rejected By Teacher', text: 'You rejected the proposed teaching price. You can edit and submit again.', tone: 'danger' },
  6: { label: 'Banned', text: 'This teacher account has been banned.', tone: 'danger' },
};

const EMPTY_PROFILE = {
  teacherProfileId: 0,
  userId: 0,
  teacherName: '',
  country: '',
  avatarUrl: '',
  introVideoUrl: '',
  englishCertificateUrl: '',
  specialty: '',
  experienceYears: 0,
  description: '',
  desiredPricePerHour: 0,
  approvedPricePerHour: null,
  ratingAverage: 0,
  totalReviews: 0,
  status: 0,
  adminNote: '',
  approvedBy: '',
};

/** 24 Become a Teacher — design-mobile/screens/BecomeTeacher.dc.html (giáo viên dùng làm "Teacher Profile"). */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonFooter,
    IonRefresher,
    IonRefresherContent,
    FormsModule,
    DatePipe,
    NavBarComponent,
    IconComponent,
    BadgeComponent,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './become-teacher.page.html',
  styleUrls: ['./become-teacher.page.css'],
})
export class BecomeTeacherPage implements OnInit {
  private teacher = inject(TeacherProfileService);
  private auth = inject(AuthService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);
  readonly icons = ICONS;
  readonly videoIcon = 'M23 7l-7 5 7 5zM1 5h15v14H1z';
  readonly uploadIcon = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12';
  readonly fileIcon = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6';

  profile: any = { ...EMPTY_PROFILE };
  hasProfile = false;
  loading = true;
  busy = false;
  submitted = false;
  uploadingVideo = false;
  uploadingCert = false;
  videoPreviewUrl = '';

  readonly meHref = this.auth.currentGroup() === 'student' ? '/me' : '/teacher/me';

  get title(): string {
    return this.auth.currentGroup() === 'student' ? 'Become a Teacher' : 'Teacher Profile';
  }

  get status() {
    return STATUS[this.profile.status] ?? { label: 'Unknown', text: '', tone: 'info' as AlertTone };
  }

  /** Form chỉ sửa được khi Draft / bị Admin từ chối / GV từ chối giá. */
  get canEdit(): boolean {
    return [0, 3, 5].includes(this.profile.status);
  }

  get canSubmit(): boolean {
    return this.hasProfile && this.profile.status === 0;
  }

  get canDecide(): boolean {
    return this.profile.status === 2;
  }

  get videoSrc(): string {
    return this.videoPreviewUrl || mediaUrl(this.profile.introVideoUrl, 'videos');
  }

  get certName(): string {
    return this.profile.englishCertificateUrl || '';
  }

  ngOnInit(): void {
    this.load();
  }

  async load(event?: CustomEvent): Promise<void> {
    try {
      const res = await firstValueFrom(this.teacher.getMyProfile());
      if (res) {
        this.profile = res;
        this.hasProfile = true;
      }
    } catch {
      // chưa có hồ sơ → form trống
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
      (event?.target as HTMLIonRefresherElement | undefined)?.complete();
    }
  }

  async save(): Promise<void> {
    this.submitted = true;
    if (!this.profile.specialty) return void this.fb.toast('Please enter specialty', 'error');
    if (!this.profile.description) return void this.fb.toast('Please enter description', 'error');
    if (!this.profile.desiredPricePerHour || this.profile.desiredPricePerHour <= 0) {
      return void this.fb.toast('Desired price per hour must be greater than 0', 'error');
    }
    const req = this.hasProfile ? this.teacher.updateProfile(this.profile) : this.teacher.createProfile(this.profile);
    await this.run(
      req,
      this.hasProfile ? 'Teacher profile updated successfully' : 'Teacher profile created successfully',
      'Failed to save teacher profile',
    );
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) return;
    const ok = await this.fb.confirm({
      header: 'Submit Profile',
      message: 'Are you sure you want to submit your profile for review?',
      okText: 'Submit',
    });
    if (ok) await this.run(this.teacher.submitProfile(), 'Profile submitted successfully', 'Failed to submit profile');
  }

  async accept(): Promise<void> {
    const ok = await this.fb.confirm({
      header: 'Accept Teaching',
      message: 'Do you accept the teaching price proposed by admin?',
      okText: 'Accept',
    });
    if (!ok) return;
    if (await this.run(this.teacher.acceptProfile(), 'You are now an approved teacher', 'Failed to accept')) {
      // JWT hiện tại vẫn mang role cũ (backend không cấp token mới, các API phân quyền đọc role trong token)
      // → đăng nhập lại để có token role Teacher và vào Teacher panel
      await this.fb.confirm({
        header: 'Welcome, teacher!',
        message: 'Please sign in again to open the Teacher panel.',
        okText: 'Sign in again',
        cancelText: 'OK',
      });
      this.auth.logout();
    }
  }

  async reject(): Promise<void> {
    const ok = await this.fb.confirm({
      header: 'Reject Teaching',
      message: 'Do you want to reject the proposed teaching price?',
      okText: 'Reject',
      danger: true,
    });
    if (ok) await this.run(this.teacher.rejectApprovedProfile(), 'Teaching offer rejected', 'Failed to reject');
  }

  async onVideoSelected(event: Event): Promise<void> {
    const file = this.takeFile(event);
    if (!file) return;
    this.uploadingVideo = true;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.teacher.uploadVideo(file));
      this.profile.introVideoUrl = res.videoUrl;
      if (this.videoPreviewUrl) URL.revokeObjectURL(this.videoPreviewUrl);
      this.videoPreviewUrl = URL.createObjectURL(file);
    } catch {
      this.fb.toast('Upload video failed', 'error');
    } finally {
      this.uploadingVideo = false;
      this.cdr.markForCheck();
    }
  }

  async onCertificateSelected(event: Event): Promise<void> {
    const file = this.takeFile(event);
    if (!file) return;
    this.uploadingCert = true;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.teacher.uploadCertificate(file));
      this.profile.englishCertificateUrl = res.fileUrl;
    } catch {
      this.fb.toast('Upload certificate failed', 'error');
    } finally {
      this.uploadingCert = false;
      this.cdr.markForCheck();
    }
  }

  openCertificate(): void {
    window.open(mediaUrl(this.profile.englishCertificateUrl, 'certificates'), '_blank');
  }

  private takeFile(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    return file;
  }

  /** Gọi API + toast + tải lại hồ sơ. Trả về true nếu thành công. */
  private async run(req: Observable<any>, okMsg: string, failMsg: string): Promise<boolean> {
    this.busy = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(req);
      this.hasProfile = true;
      this.fb.toast(okMsg, 'success');
      await this.load();
      return true;
    } catch (err) {
      this.fb.toast(errorMessage(err, failMsg), 'error');
      return false;
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }
}
