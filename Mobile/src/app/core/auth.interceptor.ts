import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

/** Giống interceptor của web: gắn JWT + múi giờ cho request tới backend, 401 → về Login. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  // serverUrl rỗng (bản web ở /m, cùng địa chỉ backend) → backend nhận diện qua đường dẫn tương đối;
  // không gắn token vào request ra ngoài (Google Translate, restcountries…)
  const isBackend =
    req.url.startsWith(environment.apiBaseUrl) ||
    (environment.serverUrl ? req.url.startsWith(environment.serverUrl) : req.url.startsWith('/'));

  if (isBackend) {
    req = req.clone({
      setHeaders: {
        'X-Timezone-Offset': String(-new Date().getTimezoneOffset()),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401 && isBackend) {
        localStorage.removeItem('token');
        router.navigateByUrl('/login', { replaceUrl: true });
      }
      return throwError(() => err);
    }),
  );
};
