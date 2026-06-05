import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute } from '@angular/router';

import { TeacherClassService } from '../../../../services/teacher-class.service';

import {
  TeacherClassDto,
  ClassSessionDto,
} from '../../../../models/teacher-class.model';

@Component({
  selector: 'app-student-course-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ClassDetail.component.html',
  styleUrls: ['./ClassDetail.component.css'],
})
export class StudentCourseDetailComponent implements OnInit {
  loading = false;

  classId = 0;

  teacherClass?: TeacherClassDto;

  selectedSession?: ClassSessionDto;

  constructor(
    private route: ActivatedRoute,
    private teacherClassService: TeacherClassService,
  ) {}

  ngOnInit(): void {
    this.classId = Number(this.route.snapshot.paramMap.get('id'));

    this.loadCourse();
  }

  loadCourse(): void {
    this.loading = true;

    this.teacherClassService.getClassById(this.classId).subscribe({
      next: (res) => {
        this.teacherClass = res;

        if (
          this.teacherClass.sessions &&
          this.teacherClass.sessions.length > 0
        ) {
          this.selectedSession = this.teacherClass.sessions[0];
        }

        this.loading = false;
      },

      error: () => {
        this.loading = false;
      },
    });
  }

  selectSession(session: ClassSessionDto): void {
    this.selectedSession = session;
  }
}
