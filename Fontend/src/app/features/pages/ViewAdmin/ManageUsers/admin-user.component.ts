import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';

import { AccountService } from '../../../services/account.service';

import { BaseService } from '../../../services/base.service';

@Component({
  selector: 'app-admin-user',

  standalone: true,

  imports: [FormsModule, CommonModule],

  templateUrl: './admin-user.component.html',

  styleUrls: ['./admin-user.component.css'],
})
export class AdminUserComponent {
  users: any[] = [];

  email = '';

  status: number | null = null;

  roleId: number | null = null;

  page = 1;

  pageSize = 10;

  total = 0;

  totalPage = 1;

  loading = false;

  constructor(
    private api: AccountService,

    private baseService: BaseService,
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;

    this.api
      .getUsers(
        this.email,
        this.status!,
        this.roleId!,
        this.page,
        this.pageSize,
      )
      .subscribe({
        next: (res: any) => {
          this.users = res.data || [];

          this.total = res.total || 0;

          this.totalPage = Math.ceil(this.total / this.pageSize);

          this.loading = false;
        },

        error: (err) => {
          this.loading = false;

          this.baseService.handleError(err, 'Cannot load users');
        },
      });
  }

  saveUser(user: any) {
    const id = user.email;

    this.api.updateUserStatus(id, Number(user.status)).subscribe({
      next: () => {
        this.api.updateUserRole(id, user.roleName).subscribe({
          next: () => {
            alert('Updated successfully');

            this.loadUsers();
          },

          error: (err) =>
            this.baseService.handleError(err, 'Role update failed'),
        });
      },

      error: (err) => this.baseService.handleError(err, 'Status update failed'),
    });
  }

  nextPage() {
    if (this.page < this.totalPage) {
      this.page++;

      this.loadUsers();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;

      this.loadUsers();
    }
  }

  search() {
    this.page = 1;

    this.loadUsers();
  }
}
