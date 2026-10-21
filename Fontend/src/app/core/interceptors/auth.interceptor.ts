import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const router = inject(Router);

  // serverUrl rỗng (bản build) → backend cùng địa chỉ với giao diện, nhận diện qua đường dẫn tương đối
  const isBackendRequest = req.url.startsWith(environment.apiBaseUrl) ||
    (environment.serverUrl ? req.url.startsWith(environment.serverUrl) : req.url.startsWith('/'));

  if (isBackendRequest) {
    req = req.clone({
      setHeaders: {
        // phút lệch so với UTC của trình duyệt (VN = 420) → backend lọc ngày / tháng theo lịch người dùng
        'X-Timezone-Offset': String(-new Date().getTimezoneOffset()),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) {
        localStorage.removeItem('token');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
