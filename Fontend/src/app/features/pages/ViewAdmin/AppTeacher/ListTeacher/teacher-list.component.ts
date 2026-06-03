import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TeacherProfileService } from '../../../../services/teacherProfile.service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-admin-teacher-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-list.component.html',
  styleUrls: ['./teacher-list.component.css'],
})
export class AdminTeacherListComponent implements OnInit {
  teachers: any[] = [];

  loading = false;

  selectedStatus = -1;

  constructor(
    private teacherService: TeacherProfileService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.isAdmin()) {
      this.router.navigate(['/home']);
      return;
    }

    this.loadTeachers();
  }

  loadTeachers(): void {
    this.loading = true;

    const request =
      this.selectedStatus === -1
        ? this.teacherService.getAllTeachers()
        : this.teacherService.getAllTeachers(this.selectedStatus);

    request.subscribe({
      next: (res: any) => {
        this.teachers = res || [];

        this.loading = false;
      },

      error: (err) => {
        console.error(err);

        this.loading = false;
      },
    });
  }

  setStatusFilter(status: number): void {
    this.selectedStatus = status;

    this.loadTeachers();
  }

  openTeacherDetail(teacherProfileId: number): void {
    this.router.navigate(['/admin/teachers', teacherProfileId]);
  }

  banTeacher(id: number): void {
    const reason = prompt('Nhập lý do khóa giáo viên:');

    if (!reason || !reason.trim()) {
      return;
    }

    this.teacherService.banTeacher(id, reason).subscribe({
      next: () => {
        alert('Khóa giáo viên thành công');

        this.loadTeachers();
      },

      error: (err) => {
        console.error(err);

        alert(err?.error?.message || 'Có lỗi xảy ra');
      },
    });
  }

  getStatusText(status: number): string {
    switch (status) {
      case 0:
        return 'Created';

      case 1:
        return 'Submitted';

      case 2:
        return 'Approved By Admin';

      case 3:
        return 'Rejected By Admin';

      case 4:
        return 'Approved Teacher';

      case 5:
        return 'Rejected Teacher';

      case 6:
        return 'Banned';

      default:
        return 'Unknown';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 1:
        return 'submitted';

      case 2:
        return 'approved-admin';

      case 3:
        return 'rejected-admin';

      case 4:
        return 'approved-teacher';

      case 5:
        return 'rejected-teacher';

      case 6:
        return 'banned';

      default:
        return '';
    }
  }

  canBan(status: number): boolean {
    return status !== 6;
  }

  getImageUrl(url: string): string {
    if (!url) {
      return 'assets/images/default-avatar.png';
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    return `http://localhost:5108/uploads/${url}`;
  }

  private isAdmin(): boolean {
    const token = localStorage.getItem('token');

    if (!token) {
      return false;
    }

    try {
      const payload: any = jwtDecode(token);

      const role =
        payload.role ||
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      const raw = role?.toString().trim().toLowerCase();

      return raw === 'admin' || raw === '2';
    } catch {
      return false;
    }
  }
}
