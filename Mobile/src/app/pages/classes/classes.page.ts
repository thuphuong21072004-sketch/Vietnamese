import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { FeedbackService } from '../../core/feedback.service';
import { SegmentedComponent } from '../../ui/segmented.component';
import { ClassBrowseComponent } from './class-browse.component';
import { MyClassesComponent } from './my-classes.component';

type Seg = 'browse' | 'mine';

/**
 * 18/20 Classes tab — design-mobile/screens/GroupClasses.dc.html (segment "Find classes")
 * + MyClasses.dc.html (segment "My Classes"). URL: /classes?seg=browse|mine; Stripe quay về kèm ?payment=success|cancel.
 */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonRefresher, IonRefresherContent, SegmentedComponent, ClassBrowseComponent, MyClassesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './classes.page.html',
  styleUrls: ['./classes.page.css'],
})
export class ClassesPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  @ViewChild(ClassBrowseComponent) browse?: ClassBrowseComponent;
  @ViewChild(MyClassesComponent) mine?: MyClassesComponent;

  readonly options = [
    { value: 'browse', label: 'Find classes' },
    { value: 'mine', label: 'My Classes' },
  ];

  seg: Seg = 'browse';
  /** Segment đã mở ít nhất một lần (giữ lại để không mất bộ lọc khi chuyển qua lại). */
  visited: Record<Seg, boolean> = { browse: false, mine: false };
  private entered = false;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((q) => {
      const payment = q.get('payment');
      const seg: Seg = q.get('seg') === 'mine' || payment ? 'mine' : 'browse';
      this.show(seg);
      if (payment === 'success' || payment === 'cancel') {
        if (payment === 'success') this.fb.toast('Payment successful! You are now enrolled in the class.', 'success');
        else this.fb.toast('Payment was cancelled.', 'error');
        // bỏ ?payment để không hiện lại toast
        this.router.navigate([], { relativeTo: this.route, queryParams: { seg: 'mine' }, replaceUrl: true });
        this.mine?.reload();
      }
    });
  }

  /** Quay lại tab (sau Payment / Review / Class Detail) → làm mới segment đang xem. */
  ionViewWillEnter(): void {
    if (!this.entered) {
      this.entered = true;
      return;
    }
    this.refreshActive();
  }

  get title(): string {
    return this.seg === 'mine' ? 'My Classes' : 'Find Vietnamese Classes';
  }

  changeSeg(value: string): void {
    const seg: Seg = value === 'mine' ? 'mine' : 'browse';
    const wasVisited = this.visited[seg];
    this.router.navigate([], { relativeTo: this.route, queryParams: { seg }, replaceUrl: true });
    // enroll / hủy ở segment này ảnh hưởng segment kia → tải lại khi quay lại
    if (wasVisited) setTimeout(() => this.refreshActive());
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.refreshActive();
    (event.target as HTMLIonRefresherElement | null)?.complete();
  }

  private show(seg: Seg): void {
    this.seg = seg;
    this.visited = { ...this.visited, [seg]: true };
    this.cdr.markForCheck();
  }

  private refreshActive(): Promise<void> {
    return (this.seg === 'mine' ? this.mine?.reload() : this.browse?.reload()) ?? Promise.resolve();
  }
}
