import { isNative } from './platform-ui';

/** Đang chạy bản web của giao diện mobile ở /m (backend phục vụ, cùng địa chỉ với web cũ). */
export function isMobileWebBuild(): boolean {
  if (isNative()) return false;
  try {
    return new URL(document.baseURI).pathname.startsWith('/m/');
  } catch {
    return false;
  }
}

/**
 * Hiện nút "Desktop version": chỉ khi xem bản /m trên laptop / tablet.
 * Trên điện thoại ẩn đi — web cũ không thiết kế cho màn hình hẹp nên sẽ vỡ bố cục.
 */
export function canSwitchToDesktop(): boolean {
  const isPhone = /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isMobileWebBuild() && !isPhone;
}

/** Chuyển sang web cũ (bản máy tính) và nhớ lựa chọn để web không tự đẩy lại về /m. */
export function switchToDesktopSite(): void {
  try {
    localStorage.setItem('vp-view', 'desktop');
  } catch {}
  window.location.href = '/';
}

export const DESKTOP_ICON = 'M2 4h20v12H2zM8 20h8M12 16v4';

/** File APK do GitHub Actions build (.github/workflows/android-apk.yml) — link cố định, luôn là bản mới nhất. */
export const ANDROID_APK_URL =
  'https://github.com/thuphuong21072004-sketch/Vietnamese/releases/download/android-latest/vietphuong.apk';

/** Đang mở bản web trên điện thoại Android (không phải trong app) → gợi ý tải app Android. */
export function canOfferAndroidApp(): boolean {
  return !isNative() && /Android/i.test(navigator.userAgent);
}

/** iPhone/iPad mở bằng trình duyệt, chưa "Thêm vào MH chính" → hiện hướng dẫn cài PWA. */
export function canOfferIosInstallHint(): boolean {
  if (isNative() || !/iPhone|iPad|iPod/i.test(navigator.userAgent)) return false;
  const standalone =
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches;
  return !standalone;
}

export const DOWNLOAD_ICON = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3';
