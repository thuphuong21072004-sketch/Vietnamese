import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TestService } from '../../../services/test.service';
import { PlacementDTO } from '../../../models/placement.model';
import { QuizComponent } from '../Learning/quiz/test.component';

@Component({
  selector: 'app-placement',
  standalone: true,
  imports: [CommonModule, FormsModule, QuizComponent],
  templateUrl: './placement.component.html',
  styleUrls: ['./placement.component.css'],
})
export class PlacementComponent implements OnInit {
  placements: PlacementDTO[] = [];

  form: PlacementDTO = {
    placementId: 0,
    name: '',
    description: '',
  };

  isDetail = false;
  showQuiz = false;

  constructor(private testService: TestService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.testService.getPlacements().subscribe((res) => {
      this.placements = res;
    });
  }

  goList() {
    this.isDetail = false;
    this.showQuiz = false;
  }

  openAdd() {
    this.form = {
      placementId: 0,
      name: '',
      description: '',
    };
    this.isDetail = true;
  }

  openEdit(p: PlacementDTO) {
    this.form = JSON.parse(JSON.stringify(p));
    this.isDetail = true;
  }

  save() {
    if (!this.form.name.trim()) {
      alert('Please enter a name');
      return;
    }

    this.testService.savePlacement(this.form).subscribe({
      next: () => {
        this.load();
        if (this.form.placementId === 0) {
          setTimeout(() => {
            this.testService.getPlacements().subscribe((res) => {
              const last = res[res.length - 1];
              this.form = last;
            });
          }, 300);
        }
      },
    });
  }

  delete(id: number) {
    if (!confirm('Are you sure you want to delete this placement?')) {
      return;
    }

    this.testService.deletePlacement(id).subscribe(() => {
      this.load();

      this.goList();
    });
  }

  trackById(index: number, item: any) {
    return item.placementId;
  }
  toggleQuiz(): void {
    this.showQuiz = !this.showQuiz;
  }
}
