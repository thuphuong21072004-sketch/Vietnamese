import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonModal, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { concatMap } from 'rxjs';
import { AccountService } from '@web/services/account.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { AvatarComponent } from '../../ui/avatar.component';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';

interface AdminUserRow {
  email: string;
  name?: string;
  country?: string;
  bio?: string;
  avatarUrl?: string;
  status: number | null;
  roleName: string;
  [k: string]: unknown;
}

/** 31 User Management — design-mobile/screens/AdminUsers.dc.html */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    FormsModule,
    AvatarComponent,
    IconComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.page.html',
  styleUrls: ['./admin.css', './users.page.css'],
  host: { class: 'bg-admin' },
})
export class AdminUsersPage implements OnInit {
  private api = inject(AccountService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = ICONS;
  readonly filterIcon = 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6';

  readonly statusOptions: { value: number | null; label: string }[] = [
    { value: null, label: 'All' },
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' },
  ];
  readonly roleOptions: { value: number | null; label: string }[] = [
    { value: null, label: 'All' },
    { value: 1, label: 'User' },
    { value: 2, label: 'Admin' },
    { value: 3, label: 'Moderator' },
    { value: 5, label: 'Teacher' },
  ];
  readonly roleNames = ['Admin', 'User', 'Moderator', 'Teacher'];

  users: AdminUserRow[] = [];
  email = '';
  status: number | null = null;
  roleId: number | null = null;
  page = 1;
  readonly pageSize = 10;
  total = 0;
  totalPage = 1;
  loading = true;
  savingEmail: string | null = null;

  // bottom sheet Filters (giá trị tạm, chỉ áp dụng khi Apply)
  filtersOpen = false;
  draftStatus: number | null = null;
  draftRoleId: number | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  get activeFilterCount(): number {
    return (this.status !== null ? 1 : 0) + (this.roleId !== null ? 1 : 0);
  }

  loadUsers(event?: CustomEvent): void {
    if (!event) {
      this.loading = true;
      this.cdr.markForCheck();
    }
    this.api
      .getUsers(this.email.trim() || undefined, this.status ?? undefined, this.roleId ?? undefined, this.page, this.pageSize)
      .subscribe({
        next: (res: any) => {
          this.users = res?.data || [];
          this.total = res?.total || 0;
          this.totalPage = Math.max(1, Math.ceil(this.total / this.pageSize));
          this.loading = false;
          this.cdr.markForCheck();
          (event?.target as HTMLIonRefresherElement | undefined)?.complete();
        },
        error: (err) => {
          this.loading = false;
          this.fb.toast(errorMessage(err, 'Cannot load users'), 'error');
          this.cdr.markForCheck();
          (event?.target as HTMLIonRefresherElement | undefined)?.complete();
        },
      });
  }

  search(): void {
    this.page = 1;
    this.loadUsers();
  }

  /** Xoá hết ô tìm (nút x của input search) → tải lại. */
  onSearchInput(): void {
    if (!this.email) this.search();
  }

  avatar(u: AdminUserRow): string {
    return mediaUrl(u.avatarUrl, 'uploads');
  }

  rowNumber(i: number): number {
    return (this.page - 1) * this.pageSize + i + 1;
  }

  saveUser(u: AdminUserRow): void {
    if (this.savingEmail) return;
    const id = u.email;
    this.savingEmail = id;
    this.api
      .updateUserStatus(id, Number(u.status))
      .pipe(concatMap(() => this.api.updateUserRole(id, u.roleName)))
      .subscribe({
        next: () => {
          this.savingEmail = null;
          this.fb.toast('Updated successfully', 'success');
          this.loadUsers();
        },
        error: (err) => {
          this.savingEmail = null;
          this.fb.toast(errorMessage(err, 'Update failed'), 'error');
          this.cdr.markForCheck();
        },
      });
  }

  nextPage(): void {
    if (this.page < this.totalPage) {
      this.page++;
      this.loadUsers();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadUsers();
    }
  }

  openFilters(): void {
    this.draftStatus = this.status;
    this.draftRoleId = this.roleId;
    this.filtersOpen = true;
  }

  applyFilters(): void {
    this.status = this.draftStatus;
    this.roleId = this.draftRoleId;
    this.filtersOpen = false;
    this.search();
  }

  clearFilters(): void {
    this.draftStatus = null;
    this.draftRoleId = null;
    this.status = null;
    this.roleId = null;
    this.filtersOpen = false;
    this.search();
  }
}
