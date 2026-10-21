import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonFooter, IonHeader, IonModal, NavController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { LearningService } from '@web/services/learning.service';
import { LevelDTO } from '@web/models/level.model';
import { CourseDTO } from '@web/models/course.model';
import { UnitDTO } from '@web/models/unit.model';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';

type Seg = 'levels' | 'courses' | 'units';

/** 33 Content Management — design-mobile/screens/ContentMgmt.dc.html (gộp Level / Course / Unit Management của web). */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonFooter, IonModal, FormsModule, DatePipe, IconComponent, LoadingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content.page.html',
  styleUrls: ['./content.css', './content.page.css'],
  host: { class: 'bg-admin' },
})
export class ContentPage implements OnInit {
  private learning = inject(LearningService);
  private fb = inject(FeedbackService);
  private nav = inject(NavController);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  readonly icons = ICONS;
  readonly plus = 'M12 5v14M5 12h14';

  readonly segs: { value: Seg; label: string }[] = [
    { value: 'levels', label: 'Levels' },
    { value: 'courses', label: 'Courses' },
    { value: 'units', label: 'Units' },
  ];

  seg: Seg = 'levels';
  loading = true;
  saving = false;
  /** Có thay đổi chưa lưu ở Levels / Courses. */
  dirty = false;

  levels: LevelDTO[] = [];
  courses: CourseDTO[] = [];
  units: UnitDTO[] = [];
  level: LevelDTO | null = null;
  course: CourseDTO | null = null;

  /** Dòng đang sửa trong bottom sheet. */
  editLevel: LevelDTO | null = null;
  editCourse: CourseDTO | null = null;

  private levelsLoaded = false;
  private entered = false;

  get title(): string {
    return this.seg === 'levels' ? 'Level Management' : this.seg === 'courses' ? 'Course Management' : 'Unit Management';
  }

  get selectedUnitCount(): number {
    return this.units.filter((u) => u.isDelete && u.unitId !== 0).length;
  }

  ngOnInit(): void {
    // Hỗ trợ mở thẳng: /admin/content?seg=units&courseId=3 (vd quay lại từ Unit editor)
    const q = this.route.snapshot.queryParamMap;
    const seg = q.get('seg') as Seg | null;
    const levelId = Number(q.get('levelId') || 0);
    const courseId = Number(q.get('courseId') || 0);
    this.init(seg, levelId, courseId);
  }

  /** Quay lại từ Unit editor / Quiz editor: tải lại danh sách unit (không đụng Levels/Courses đang sửa). */
  ionViewWillEnter(): void {
    if (this.entered && this.seg === 'units' && this.course) this.loadUnits();
    this.entered = true;
  }

  private async init(seg: Seg | null, levelId: number, courseId: number): Promise<void> {
    try {
      if (courseId > 0) {
        this.course = await firstValueFrom(this.learning.getCourseById(courseId));
        levelId = levelId || this.course?.levelId || 0;
      }
      if (levelId > 0) this.level = await firstValueFrom(this.learning.getLevelById(levelId));
    } catch {
      // bỏ qua — rơi về danh sách level
    }
    if (seg === 'units' && this.course) {
      this.seg = 'units';
      await this.loadUnits();
    } else if ((seg === 'courses' || seg === 'units') && this.level) {
      this.seg = 'courses';
      await this.loadCourses();
    } else {
      this.seg = 'levels';
      await this.loadLevels();
    }
  }

  // ---------- Điều hướng segment ----------

  async changeSeg(next: Seg): Promise<void> {
    if (next === this.seg) return;
    if (!(await this.confirmDiscard())) return;

    if (next === 'levels') {
      this.seg = 'levels';
      await this.loadLevels();
      return;
    }

    if (!this.level) {
      // Như web: mặc định chọn level đầu tiên
      if (!this.levelsLoaded) await this.loadLevels(false);
      this.level = this.levels.find((l) => l.levelId > 0) ?? null;
    }

    if (next === 'courses') {
      this.seg = 'courses';
      await this.loadCourses();
      return;
    }

    // Units
    if (!this.course) {
      if (this.level && (!this.courses.length || this.courses[0].levelId !== this.level.levelId)) {
        await this.loadCourses(false);
      }
      this.course = this.courses.find((c) => c.courseId > 0) ?? null;
    }
    this.seg = 'units';
    await this.loadUnits();
  }

  async openLevel(l: LevelDTO): Promise<void> {
    if (!l.levelId) return;
    if (!(await this.confirmDiscard())) return;
    this.level = l;
    this.course = null;
    this.seg = 'courses';
    await this.loadCourses();
  }

  async openCourse(c: CourseDTO): Promise<void> {
    if (!c.courseId) return;
    if (!(await this.confirmDiscard())) return;
    this.course = c;
    this.seg = 'units';
    await this.loadUnits();
  }

  openUnit(u: UnitDTO): void {
    if (!u.unitId) return;
    this.nav.navigateForward(['/admin/units', u.unitId]);
  }

  addUnit(): void {
    if (!this.course) return;
    this.nav.navigateForward(['/admin/units/new'], { queryParams: { courseId: this.course.courseId } });
  }

  manageLevelQuiz(): void {
    if (!this.level?.levelId) return;
    this.nav.navigateForward(['/admin/quiz'], { queryParams: { refType: 'LEVEL_JUMP', refId: this.level.levelId } });
  }

  manageCourseQuiz(): void {
    if (!this.course?.courseId) return;
    this.nav.navigateForward(['/admin/quiz'], { queryParams: { refType: 'COURSE_JUMP', refId: this.course.courseId } });
  }

  private async confirmDiscard(): Promise<boolean> {
    if (!this.dirty || this.seg === 'units') return true;
    const ok = await this.fb.confirm({
      header: 'Discard changes?',
      message: 'You have unsaved changes. Leave without saving?',
      okText: 'Discard',
      danger: true,
    });
    if (ok) this.dirty = false;
    return ok;
  }

  // ---------- Tải dữ liệu ----------

  async loadLevels(selectFirst = true): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.levels = (await firstValueFrom(this.learning.getLevels())) ?? [];
      this.levelsLoaded = true;
      this.dirty = false;
      if (selectFirst && !this.level) this.level = this.levels[0] ?? null;
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load levels'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
  }

  async loadCourses(showLoading = true): Promise<void> {
    if (!this.level) {
      this.courses = [];
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    if (showLoading) {
      this.loading = true;
      this.cdr.markForCheck();
    }
    try {
      this.courses = (await firstValueFrom(this.learning.getCourses(this.level.levelId))) ?? [];
      this.dirty = false;
    } catch (err) {
      this.courses = [];
      this.fb.toast(errorMessage(err, 'Failed to load courses'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
  }

  async loadUnits(): Promise<void> {
    if (!this.course) {
      this.units = [];
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.units = (await firstValueFrom(this.learning.getUnits(this.course.courseId))) ?? [];
    } catch (err) {
      this.units = [];
      this.fb.toast(errorMessage(err, 'Failed to load units'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
  }

  // ---------- Levels ----------

  private levelsValid(): boolean {
    return this.levels.every((l) => l.isDelete || (l.levelName?.trim() && l.description?.trim()));
  }

  addLevel(): void {
    if (!this.levelsValid()) {
      this.fb.toast('Please enter all the required information before adding!', 'error');
      return;
    }
    const row: LevelDTO = {
      levelId: 0,
      levelName: '',
      description: '',
      orderIndex: 0,
      isActive: false,
      status: false,
      isDelete: false,
      courses: [],
    };
    this.levels.push(row);
    this.dirty = true;
    this.editLevel = row;
  }

  async saveLevels(): Promise<void> {
    if (!this.levelsValid()) {
      this.fb.toast('Please enter all the required information before saving!', 'error');
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.learning.saveLevel(this.levels));
      this.fb.toast('Levels saved successfully.', 'success');
      const keepId = this.level?.levelId;
      await this.loadLevels(false);
      this.level = this.levels.find((l) => l.levelId === keepId) ?? this.levels[0] ?? null;
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Level cannot be saved'), 'error');
    }
    this.saving = false;
    this.cdr.markForCheck();
  }

  // ---------- Courses ----------

  private coursesValid(): boolean {
    return this.courses.every((c) => c.isDelete || (c.courseName?.trim() && c.description?.trim()));
  }

  addCourse(): void {
    if (!this.level) return;
    if (!this.coursesValid()) {
      this.fb.toast('Please enter all the required information before adding!', 'error');
      return;
    }
    const row: CourseDTO = {
      courseId: 0,
      levelId: this.level.levelId,
      courseName: '',
      description: '',
      orderIndex: 0,
      createdBy: '',
      isActive: true,
      status: false,
      isDelete: false,
      units: [],
    };
    this.courses.push(row);
    this.dirty = true;
    this.editCourse = row;
  }

  async saveCourses(): Promise<void> {
    if (!this.coursesValid()) {
      this.fb.toast('Please enter all the required information before saving!', 'error');
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.learning.saveCourse(this.courses));
      this.fb.toast('Courses saved successfully.', 'success');
      await this.loadCourses(false);
      if (this.course) this.course = this.courses.find((c) => c.courseId === this.course?.courseId) ?? null;
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Error saving course'), 'error');
    }
    this.saving = false;
    this.cdr.markForCheck();
  }

  // ---------- Units ----------

  async deleteSelectedUnits(): Promise<void> {
    const ids = this.units.filter((u) => u.isDelete && u.unitId !== 0).map((u) => u.unitId);
    if (!ids.length) {
      this.fb.toast('No Unit selected to delete');
      return;
    }
    const ok = await this.fb.confirm({
      header: 'Delete units?',
      message: `Delete ${ids.length} selected unit(s)? This cannot be undone.`,
      okText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.learning.deleteUnits(ids));
      this.fb.toast('Deleted successfully', 'success');
      await this.loadUnits();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Error when deleting lesson'), 'error');
    }
    this.saving = false;
    this.cdr.markForCheck();
  }

  // ---------- Chung ----------

  markDirty(): void {
    this.dirty = true;
  }

  closeSheet(): void {
    this.editLevel = null;
    this.editCourse = null;
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.seg === 'levels') this.saveLevels();
    else if (this.seg === 'courses') this.saveCourses();
  }
}
