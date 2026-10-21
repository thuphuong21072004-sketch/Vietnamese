import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth.interceptor';
import { FeedbackService } from './app/core/feedback.service';
import { isNative } from './app/core/platform-ui';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // persistConfig: giữ ?ionic:mode=ios|md trong cả phiên (xem thử iPhone / Android trên trình duyệt)
    provideIonicAngular({ swipeBackEnabled: true, persistConfig: true } as any),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).then((appRef) => {
  // Xem trên trình duyệt: chừa vùng an toàn như artboard (README §3)
  if (environment.simulateSafeArea && !isNative()) {
    document.documentElement.classList.add('vp-sim-safe');
  }
  if (!isNative()) {
    // Người dùng đang ở giao diện mobile → web cũ (Fontend/src/main.ts) không đẩy ngược về bản desktop
    try {
      localStorage.setItem('vp-view', 'mobile');
    } catch {}
    // PWA (bản build ở /m): service worker để "Thêm vào màn hình chính" / "Cài ứng dụng"
    if (environment.production && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }
  // Service dùng chung của web (BaseService.handleError) gọi alert() → hiện toast thay vì hộp thoại trình duyệt
  const feedback = appRef.injector.get(FeedbackService);
  window.alert = (message?: unknown) => {
    feedback.toast(String(message ?? ''), 'error');
  };
});
