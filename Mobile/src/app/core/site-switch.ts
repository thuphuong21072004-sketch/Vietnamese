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
