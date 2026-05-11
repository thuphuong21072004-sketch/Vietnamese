import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LearningService } from '../../../../services/learning.service';
import { UnitDTO } from '../../../../models/unit.model';
import { CourseDTO } from '../../../../models/course.model';
import { Router, RouterLink } from '@angular/router';
import { BaseService } from '../../../../services/base.service';
import { QuizComponent } from '../quiz/test.component';
@Component({
  selector: 'app-Unit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, QuizComponent],
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.css'],
})
export class UnitComponent implements OnInit {
  courseId: number = 0;
  units: UnitDTO[] = [];
  course: CourseDTO | null = null;

  showCourseQuiz = false;

  constructor(
    private route: ActivatedRoute,
    private learningService: LearningService,
    private baseService: BaseService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.courseId = +params['courseId'];

      this.loadCourse();
      this.loadUnits();
    });
  }

  loadCourse() {
    this.learningService.getCourseById(this.courseId).subscribe((res) => {
      this.course = res;
    });
  }
  loadUnits() {
    this.learningService.getUnits(this.courseId).subscribe((res) => {
      this.units = res;
    });
  }

  trackById(index: number, item: any) {
    return item.unitId;
  }

  isValidAllRows(): boolean {
    return this.units.every(
      (l) => l.isDelete || (l.unitName?.trim() && l.videoUrl?.trim()),
    );
  }
  deleteSelected() {
    const ids = this.units
      .filter((l) => l.isDelete && l.unitId !== 0)
      .map((l) => l.unitId);

    if (ids.length === 0) {
      alert('No Unit selected to delete');
      return;
    }

    this.learningService.deleteUnits(ids).subscribe({
      next: () => {
        alert('Deleted successfully');
        this.loadUnits();
      },
      error: (err) =>
        this.baseService.handleError(err, 'Error when deleting lesson'),
    });
  }
}
