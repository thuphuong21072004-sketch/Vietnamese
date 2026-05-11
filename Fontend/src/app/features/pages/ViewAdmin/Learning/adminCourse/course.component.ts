import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LearningService } from '../../../../services/learning.service';
import { Router, RouterLink } from '@angular/router';
import { CourseDTO } from '../../../../models/course.model';
import { LevelDTO } from '../../../../models/level.model';
import { BaseService } from '../../../../services/base.service';
import { QuizComponent } from '../quiz/test.component';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, QuizComponent],
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.css'],
})
export class CourseComponent implements OnInit {
  levelId: number = 0;
  courses: CourseDTO[] = [];
  level: LevelDTO | null = null;
  showLevelQuiz = false;
  
  constructor(
    private route: ActivatedRoute,
    private learningService: LearningService,
    private baseService: BaseService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.levelId = +params['levelId'];

      this.loadLevel();
      this.loadCourses();
    });
  }
  loadLevel() {
    this.learningService.getLevelById(this.levelId).subscribe((res) => {
      this.level = res;
    });
  }

  loadCourses() {
    this.learningService.getCourses(this.levelId).subscribe((res) => {
      this.courses = res;
    });
  }

  isValidAllRows(): boolean {
    return this.courses.every(
      (c) => c.isDelete || (c.courseName?.trim() && c.description?.trim()),
    );
  }

  addCourse() {
    if (!this.isValidAllRows()) {
      alert('Please enter all the required information before adding!');
      return;
    }

    this.courses.push({
      courseId: 0,
      levelId: this.levelId,
      courseName: '',
      description: '',
      orderIndex: 0,
      createdBy: '',
      isActive: true,
      status: false,
      isDelete: false,
      units: [],
    });
  }

  saveCourses() {
    if (!this.isValidAllRows()) {
      alert('Please enter all the required information before saving!');
      return;
    }

    this.learningService.saveCourse(this.courses).subscribe({
      next: () => {
        alert('Success!');
        this.loadCourses();
      },
      error: (err) => this.baseService.handleError(err, 'Error saving course'),
    });
  }

  trackById(index: number, item: any) {
    return item.courseId;
  }
}