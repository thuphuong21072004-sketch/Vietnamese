import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { TestService } from '../../../services/test.service';
import { PlacementDTO } from '../../../models/placement.model';

@Component({
  selector: 'app-placement-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './placement.component.html',
  styleUrls: ['./placement.component.css'],
})
export class PlacementUserComponent implements OnInit {
  placements: PlacementDTO[] = [];

  loading = true;

  constructor(
    private testService: TestService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.testService.getPlacements().subscribe({
      next: (res) => {
        this.placements = res;

        this.loading = false;
      },

      error: () => {
        this.loading = false;

        alert('Failed to load placements');
      },
    });
  }

  openRandom() {
    if (!this.placements.length) {
      return;
    }

    const random =
      this.placements[Math.floor(Math.random() * this.placements.length)];

    this.openPlacement(random);
  }

  openPlacement(placement: PlacementDTO) {
    this.router.navigate(['/user/quiz'], {
      queryParams: {
        refType: 'PLACEMENT',

        refId: placement.placementId,
      },
    });
  }
}
