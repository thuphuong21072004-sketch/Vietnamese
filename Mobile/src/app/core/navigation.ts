import { inject } from '@angular/core';
import { IonRouterOutlet, NavController } from '@ionic/angular/standalone';

/**
 * Quay lại an toàn: chỉ pop khi Ionic thật sự có trang trước trong stack;
 * mở thẳng bằng URL / deep link (stack rỗng) thì đi tới trang dự phòng bằng navigateRoot
 * (navigateBack vào tab shell chưa tồn tại sẽ để lại màn trắng).
 * Gọi trong injection context (field initializer / constructor).
 */
export function injectSafeBack(): (fallback: string) => void {
  const nav = inject(NavController);
  const outlet = inject(IonRouterOutlet, { optional: true });
  return (fallback: string) => {
    if (outlet?.canGoBack()) nav.back();
    else nav.navigateRoot(fallback);
  };
}
