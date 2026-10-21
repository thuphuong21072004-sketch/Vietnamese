import { getPlatforms } from '@ionic/angular/standalone';

/** Chế độ hiển thị Ionic hiện tại: ios (iPhone) hoặc md (Android). */
export function isAndroidMode(): boolean {
  return document.documentElement.classList.contains('md');
}

export const BACK_ICON_IOS = 'M15 18l-6-6 6-6';
export const BACK_ICON_ANDROID = 'M19 12H5M12 19l-7-7 7-7';

export function isNative(): boolean {
  return getPlatforms().includes('capacitor');
}
