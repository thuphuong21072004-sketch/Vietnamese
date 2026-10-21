import { inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, timeout } from 'rxjs/operators';
import { AccountService } from '@web/services/account.service';
import { TeacherClassService } from '@web/services/teacher-class.service';

/**
 * Danh sách quốc gia, Vietnam đứng đầu. Thử restcountries.com (như web) trước;
 * lỗi / chặn CORS / chậm → dùng danh sách tĩnh có sẵn trong TeacherClassService.
 * Gọi trong injection context (field initializer / constructor).
 */
export function injectCountries(): () => Observable<string[]> {
  const account = inject(AccountService);
  const classes = inject(TeacherClassService);
  const toNames = (res: any[]) => vietnamFirst(res.map((x) => x?.name?.common).filter(Boolean));
  return () =>
    account.getCountries().pipe(
      timeout(6000),
      map(toNames),
      catchError(() => classes.getCountries().pipe(map(toNames))),
      switchMap((list) => (list.length ? of(list) : classes.getCountries().pipe(map(toNames)))),
    );
}

function vietnamFirst(names: string[]): string[] {
  const sorted = Array.from(new Set(names)).sort();
  return ['Vietnam', ...sorted.filter((n) => n !== 'Vietnam')];
}
