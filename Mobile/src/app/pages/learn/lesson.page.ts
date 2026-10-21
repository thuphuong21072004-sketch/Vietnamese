import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonFooter, IonHeader } from '@ionic/angular/standalone';
import { LearningService } from '@web/services/learning.service';
import { UnitDTO } from '@web/models/unit.model';
import { FeedbackService } from '../../core/feedback.service';
import { mediaUrl } from '../../core/media';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { LoadingComponent } from '../../ui/states.component';

/** 06 Lesson — design-mobile/screens/Lesson.dc.html */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonFooter, NavBarComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson.page.html',
  styleUrls: ['./lesson.page.css'],
})
export class LessonPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private learning = inject(LearningService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  unit: UnitDTO | null = null;
  unitNo = 0;
  videoSrc = '';
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('unitId'));
    this.unitNo = Number(this.route.snapshot.queryParamMap.get('n')) || 0;
    this.learning.getUnitById(id).subscribe({
      next: (u) => {
        this.unit = u;
        this.videoSrc = mediaUrl(u?.videoUrl, 'videos');
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.fb.toast('Failed to load unit', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  get title(): string {
    if (!this.unit) return '';
    return this.unitNo ? `Unit ${this.unitNo} · ${this.unit.unitName}` : this.unit.unitName;
  }

  startTest(): void {
    if (!this.unit) return;
    this.router.navigate(['/quiz'], {
      queryParams: { unitId: this.unit.unitId, refType: 'UNIT', refId: this.unit.unitId, n: this.unitNo || null },
    });
  }
}
