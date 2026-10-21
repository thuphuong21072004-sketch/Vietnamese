import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { TestService } from '@web/services/test.service';
import { PlacementDTO } from '@web/models/placement.model';
import { FeedbackService } from '../../core/feedback.service';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { IconComponent } from '../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';

/** 04 Practice Tests — design-mobile/screens/PracticeTests.dc.html */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, NavBarComponent, IconComponent, LoadingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './practice-tests.page.html',
  styleUrls: ['./practice-tests.page.css'],
})
export class PracticeTestsPage implements OnInit {
  private tests = inject(TestService);
  private router = inject(Router);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly diceIcon = 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01';
  placements: PlacementDTO[] = [];
  loading = true;

  ngOnInit(): void {
    this.tests.getPlacements().subscribe({
      next: (res) => {
        this.placements = res ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.fb.toast('Failed to load placements', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  openRandom(): void {
    if (!this.placements.length) return;
    this.open(this.placements[Math.floor(Math.random() * this.placements.length)]);
  }

  open(p: PlacementDTO): void {
    this.router.navigate(['/quiz'], { queryParams: { refType: 'PLACEMENT', refId: p.placementId } });
  }
}
