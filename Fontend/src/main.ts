import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';

// Điện thoại (không phải tablet / laptop) → luôn dùng giao diện mobile ở /m (Mobile/, backend phục vụ ClientMobile),
// giữ nguyên đường dẫn để vào đúng màn. Web này không thiết kế cho màn hình điện thoại nên không cho ở lại.
// Chỉ ở bản build (backend phục vụ) — npm start (cổng 4200) không có /m.
function shouldOpenMobileSite(): boolean {
  if (!environment.production) return false;
  return /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

if (shouldOpenMobileSite()) {
  location.replace('/m' + location.pathname + location.search + location.hash);
} else {
  bootstrapApplication(AppComponent, {
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideRouter(routes)
    ]
  });
}
