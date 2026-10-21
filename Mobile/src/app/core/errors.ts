/** Lấy message lỗi từ HttpErrorResponse giống BaseService.handleError của web (không gọi alert). */
export function errorMessage(err: any, fallback: string): string {
  if (!err) return fallback;
  try {
    const parsed = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
    return parsed?.message || (typeof parsed === 'string' ? parsed : '') || fallback;
  } catch {
    return typeof err.error === 'string' && err.error ? err.error : fallback;
  }
}
