import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { TeacherProfileService } from '../../../../services/teacherProfile.service';

@Component({
  selector: 'app-admin-teacher-list',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './teacher-list.component.html',

  styleUrls: ['./teacher-list.component.css'],
})
export class AdminTeacherListComponent implements OnInit {
  teachers: any[] = [];

  loading = true;

  selectedStatus = -1;

  constructor(
    private teacherService: TeacherProfileService,

    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers() {
    this.loading = true;

    if (this.selectedStatus === -1) {
      this.teacherService.getAllTeachers().subscribe({
        next: (res: any) => {
          this.teachers = res;

          this.loading = false;
        },

        error: (err) => {
          console.error(err);

          this.loading = false;
        },
      });

      return;
    }

    this.teacherService.getAllTeachers(this.selectedStatus).subscribe({
      next: (res: any) => {
        this.teachers = res;

        this.loading = false;
      },

      error: (err) => {
        console.error(err);

        this.loading = false;
      },
    });
  }

  setStatusFilter(status: number) {
    this.selectedStatus = status;

    this.loadTeachers();
  }

  openTeacherDetail(teacherProfileId: number) {
    this.router.navigate(['/admin/teachers', teacherProfileId]);
  }

  getStatusText(status: number): string {
    switch (status) {
      case 1:
        return 'Pending';

      case 2:
        return 'Approved';

      case 3:
        return 'Rejected';

      default:
        return 'Unknown';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 1:
        return 'pending';

      case 2:
        return 'approved';

      case 3:
        return 'rejected';

      default:
        return '';
    }
  }
  getImageUrl(url: string): string {
    if (!url) {
      return '';
    }

    if (url.startsWith('data:')) {
      return url;
    }

    if (url.startsWith('http')) {
      return url;
    }

    return `http://localhost:5108/uploads/${url}`;
  }
}
