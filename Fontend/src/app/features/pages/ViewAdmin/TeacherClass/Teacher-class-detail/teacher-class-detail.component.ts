import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  TeacherClassDto,
  ClassSessionDto,
} from '../../../../models/teacher-class.model';

import { TeacherClassService } from '../../../../services/teacher-class.service';

import { BaseService } from '../../../../services/base.service';

@Component({
  selector: 'app-teacher-class-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-class-detail.component.html',
  styleUrls: ['./teacher-class-detail.component.css'],
})
export class TeacherClassDetailComponent implements OnInit {
  loading = false;

  classId = 0;

  teacherClass?: TeacherClassDto;

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    private teacherClassService: TeacherClassService,

    private baseService: BaseService,
  ) {}

  ngOnInit(): void {
    this.classId = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.classId) {
      this.router.navigate(['/teacher/classes']);

      return;
    }

    this.loadClassDetail();
  }

  loadClassDetail(): void {
    this.loading = true;

    this.teacherClassService.getClassById(this.classId).subscribe({
      next: (response) => {
        this.teacherClass = response;

        this.loading = false;
      },

      error: (err) => {
        this.loading = false;

        this.baseService.handleError(err, 'Cannot load class detail');
      },
    });
  }

  editClass(): void {
    this.router.navigate(['/teacher/class/edit', this.classId]);
  }

  deleteClass(): void {
    if (!confirm('Are you sure you want to delete this class?')) {
      return;
    }

    this.teacherClassService.deleteClass(this.classId).subscribe({
      next: () => {
        alert('Class deleted successfully');

        this.router.navigate(['/teacher/listclass']);
      },

      error: (err) => {
        this.baseService.handleError(err, 'Delete class failed');
      },
    });
  }

  getSessionStatus(studyDate: string): string {
    const today = new Date();

    const sessionDate = new Date(studyDate);

    if (sessionDate < today) {
      return 'Completed';
    }

    return 'Upcoming';
  }

  trackSession(index: number, item: ClassSessionDto): number {
    return item.sessionId;
  }

  saveAllSessions(): void {
    if (!this.teacherClass) {
      return;
    }

    this.teacherClassService
      .updateSessions(this.teacherClass.classId, this.teacherClass.sessions)
      .subscribe({
        next: () => {
          alert('All sessions updated');
        },
        error: () => {
          alert('Update failed');
        },
      });
  }
}
