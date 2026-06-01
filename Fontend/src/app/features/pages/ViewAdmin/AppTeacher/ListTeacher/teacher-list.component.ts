import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { TeacherProfileService } from '../../../../services/teacherProfile.service';

import { jwtDecode } from 'jwt-decode';

import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-admin-teacher-list',

  standalone: true,

  imports: [CommonModule, RouterModule],

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
    const token = localStorage.getItem('token');

    let role = null;

    if (token) {
      try {
        const payload: any = jwtDecode(token as string);

        role =
          payload.role ||
          payload[
            'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
          ];

        const raw = role ? role.toString().trim().toLowerCase() : '';

        if (raw !== 'admin' && raw !== '2') {
          this.router.navigate(['/admin/dashboard']);

          return;
        }
      } catch {
        this.router.navigate(['/admin/dashboard']);

        return;
      }
    } else {
      this.router.navigate(['/home']);

      return;
    }

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

  /*
   * khóa giáo viên
   */
  banTeacher(id: number) {
    const confirmBan = confirm(
      'Bạn có chắc muốn khóa vĩnh viễn giáo viên này?',
    );

    if (!confirmBan) {
      return;
    }

    this.teacherService.banTeacher(id).subscribe({
      next: () => {
        alert('Khóa giáo viên thành công');

        this.loadTeachers();
      },

      error: (err) => {
        console.log(err);

        alert('Có lỗi xảy ra');
      },
    });
  }

  getStatusText(status: number): string {
    switch (status) {
      case 1:
        return 'Submitted';

      case 2:
        return 'Approved';

      case 3:
        return 'Rejected';

      case 4:
        return 'Banned';

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

      case 4:
        return 'banned';

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
