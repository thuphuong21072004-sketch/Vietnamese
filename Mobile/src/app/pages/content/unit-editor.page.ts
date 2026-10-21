import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonFooter, IonHeader, NavController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { LearningService } from '@web/services/learning.service';
import { UnitDTO } from '@web/models/unit.model';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { IconComponent } from '../../ui/icon.component';
import { LoadingComponent } from '../../ui/states.component';

/** Unit editor (chưa có design — dựng theo ui-spec §3 "Unit editor") — /admin/units/:id, /admin/units/new?courseId= */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonFooter, FormsModule, NavBarComponent, IconComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './unit-editor.page.html',
  styleUrls: ['./content.css', './unit-editor.page.css'],
  host: { class: 'bg-admin' },
})
export class UnitEditorPage implements OnInit {
  private learning = inject(LearningService);
  private fb = inject(FeedbackService);
  private nav = inject(NavController);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);
  readonly uploadIcon = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12';

  unitId = 0;
  courseId = 0;
  loading = false;
  saving = false;
  uploading = false;
  isDragging = false;
  videoFullUrl = '';

  unit: UnitDTO = {
    unitId: 0,
    courseId: 0,
    unitName: '',
    videoUrl: '',
    duration: 0,
    objective: '',
    createdBy: '',
    createdDate: new Date(),
    description: '',
    orderIndex: 0,
    isActive: true,
    isDelete: false,
  };

  get backHref(): string {
    return this.courseId ? `/admin/content?seg=units&courseId=${this.courseId}` : '/admin/content';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.unitId = id && id !== 'new' ? Number(id) || 0 : 0;
    this.courseId = Number(this.route.snapshot.queryParamMap.get('courseId') || 0);
    this.unit.courseId = this.courseId;
    if (this.unitId > 0) this.load();
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await firstValueFrom(this.learning.getUnitById(this.unitId));
      if (res) {
        this.unit = res;
        // Mở từ danh sách chỉ có unitId → lấy courseId của unit
        if (!this.courseId) this.courseId = res.courseId;
        this.videoFullUrl = res.videoUrl?.trim() ? mediaUrl(res.videoUrl, 'videos') : '';
      }
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load unit'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
  }

  // ---------- Upload video ----------

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.uploadFile(file);
    input.value = '';
  }

  private async uploadFile(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    // Xem trước ngay bằng blob trong lúc tải lên
    this.videoFullUrl = URL.createObjectURL(file);
    this.uploading = true;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.learning.uploadMedia(formData));
      this.unit.videoUrl = res.fileName;
      this.videoFullUrl = mediaUrl(res.fileName, 'videos');
      this.fb.toast('Video uploaded', 'success');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Video upload failed'), 'error');
    }
    this.uploading = false;
    this.cdr.markForCheck();
  }

  onVideoLoaded(event: Event): void {
    const d = (event.target as HTMLVideoElement).duration;
    if (isFinite(d)) {
      this.unit.duration = Math.floor(d);
      this.cdr.markForCheck();
    }
  }

  get durationText(): string {
    const s = this.unit.duration || 0;
    const m = Math.floor(s / 60);
    return m ? `${m}m ${s % 60}s` : `${s}s`;
  }

  // ---------- Lưu ----------

  async save(): Promise<void> {
    if (!this.unit.unitName?.trim()) {
      this.fb.toast('Please enter the unit title', 'error');
      return;
    }
    if (this.uploading) {
      this.fb.toast('Please wait for the video upload to finish');
      return;
    }
    this.unit.courseId = this.courseId || this.unit.courseId;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.learning.saveUnit(this.unit));
      this.fb.toast('Unit saved successfully', 'success');
      if (!this.unitId) {
        // Như web: lấy unit mới nhất của course làm unitId để mở phần quiz
        const list = await firstValueFrom(this.learning.getUnits(this.unit.courseId));
        const latest = list?.[list.length - 1];
        if (latest) {
          this.unitId = latest.unitId;
          this.unit.unitId = latest.unitId;
          // Đổi URL tại chỗ (giữ lịch sử điều hướng) để mở lại đúng unit
          this.location.replaceState(`/admin/units/${latest.unitId}`, `courseId=${this.unit.courseId}`);
        }
      }
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Unit cannot be saved'), 'error');
    }
    this.saving = false;
    this.cdr.markForCheck();
  }

  manageQuiz(): void {
    if (!this.unitId) return;
    this.nav.navigateForward(['/admin/quiz'], { queryParams: { refType: 'UNIT', refId: this.unitId } });
  }
}
