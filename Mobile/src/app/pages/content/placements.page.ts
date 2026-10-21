import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonFooter, IonHeader, IonModal, IonRefresher, IonRefresherContent, NavController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { TestService } from '@web/services/test.service';
import { PlacementDTO } from '@web/models/placement.model';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';

/** Placement Tests (chưa có design — dựng theo ui-spec §3 "Placement Tests") — /admin/placements */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonFooter,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    FormsModule,
    NavBarComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './placements.page.html',
  styleUrls: ['./content.css', './placements.page.css'],
  host: { class: 'bg-admin' },
})
export class PlacementsPage implements OnInit {
  @ViewChild(IonModal) private sheet?: IonModal;

  private tests = inject(TestService);
  private fb = inject(FeedbackService);
  private nav = inject(NavController);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  saving = false;
  placements: PlacementDTO[] = [];

  /** Form trong bottom sheet (null = đóng). */
  form: PlacementDTO | null = null;

  ngOnInit(): void {
    this.load();
  }

  async load(event?: CustomEvent): Promise<void> {
    try {
      this.placements = (await firstValueFrom(this.tests.getPlacements())) ?? [];
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load placement tests'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  openAdd(): void {
    this.form = { placementId: 0, name: '', description: '' };
  }

  openEdit(p: PlacementDTO): void {
    this.form = { ...p };
  }

  closeSheet(): void {
    this.form = null;
    this.cdr.markForCheck();
  }

  async save(): Promise<void> {
    const form = this.form;
    if (!form) return;
    if (!form.name?.trim()) {
      this.fb.toast('Please enter a name', 'error');
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();
    try {
      const isNew = !form.placementId;
      const res: any = await firstValueFrom(this.tests.savePlacement(form));
      this.placements = (await firstValueFrom(this.tests.getPlacements())) ?? [];
      if (isNew && this.form === form) {
        // Như web: bản ghi mới là phần tử cuối danh sách (ưu tiên id backend trả về)
        const id = res?.placementId ?? res?.PlacementId;
        const created = (id && this.placements.find((p) => p.placementId === id)) || this.placements[this.placements.length - 1];
        if (created) this.form = { ...created };
      }
      this.fb.toast('Placement saved', 'success');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Placement cannot be saved'), 'error');
    }
    this.saving = false;
    this.cdr.markForCheck();
  }

  async remove(): Promise<void> {
    const id = this.form?.placementId;
    if (!id) return;
    const ok = await this.fb.confirm({
      header: 'Delete placement?',
      message: 'Are you sure you want to delete this placement?',
      okText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.tests.deletePlacement(id));
      this.fb.toast('Placement deleted', 'success');
      this.form = null;
      await this.load();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Delete failed'), 'error');
    }
    this.saving = false;
    this.cdr.markForCheck();
  }

  /** Đóng sheet hẳn rồi mới chuyển sang Quiz editor (nếu không, sheet còn đè lên màn kế tiếp). */
  async manageQuiz(): Promise<void> {
    const id = this.form?.placementId;
    if (!id) return;
    await this.sheet?.dismiss();
    this.form = null;
    this.cdr.markForCheck();
    this.nav.navigateForward(['/admin/quiz'], { queryParams: { refType: 'PLACEMENT', refId: id } });
  }
}
