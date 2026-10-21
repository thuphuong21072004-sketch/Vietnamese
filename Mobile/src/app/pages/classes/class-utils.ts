/* Tiện ích dùng chung cho nhóm 5 · Lớp nhóm (logic lấy từ web: core/utils/vn-time + ClassRoom/*). */

/** Trạng thái enrollment (StatusBooking backend): 0 Pending Payment … 5 Refunded. */
export const ENROLL_STATUS_LABEL: Record<number, string> = {
  0: 'Pending Payment',
  1: 'Upcoming',
  2: 'Ongoing',
  3: 'Completed',
  4: 'Cancelled',
  5: 'Refunded',
};

export const STATUS_CHIPS: { value: number | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 0, label: 'Pending Payment' },
  { value: 1, label: 'Upcoming' },
  { value: 2, label: 'Ongoing' },
  { value: 3, label: 'Completed' },
  { value: 4, label: 'Cancelled' },
  { value: 5, label: 'Refunded' },
];

export function enrollStatusLabel(status: number | null | undefined): string {
  return status === null || status === undefined ? '' : (ENROLL_STATUS_LABEL[status] ?? '');
}

/** Giờ buổi học lưu theo giờ Việt Nam (UTC+7) — giống vnSessionTime của web. */
export function vnSessionTime(studyDate: string | null | undefined, time: string | null | undefined): Date {
  if (!studyDate || !time) return new Date(NaN);
  const hhmmss = time.length > 8 ? time.substring(0, 8) : time;
  return new Date(`${studyDate.substring(0, 10)}T${hhmmss}+07:00`);
}

interface SessionLike {
  studyDate: string;
  startTime: string;
  endTime: string;
  sessionNumber: number;
}

/** Nút Join Zoom Room mở 15 phút trước giờ học, đóng 15 phút sau khi kết thúc. */
export function canJoinSession(s: { studyDate: string; startTime: string; endTime: string }): boolean {
  const now = Date.now();
  const start = vnSessionTime(s.studyDate, s.startTime).getTime();
  const end = vnSessionTime(s.studyDate, s.endTime).getTime();
  return now >= start - 15 * 60 * 1000 && now <= end + 15 * 60 * 1000;
}

export function isPastSession(s: { studyDate: string; endTime: string }): boolean {
  return Date.now() > vnSessionTime(s.studyDate, s.endTime).getTime();
}

/** Lớp đã hủy / hoàn tiền chỉ được đăng ký lại khi chưa tới buổi đầu tiên. */
export function canEnrollAgain(sessions: SessionLike[] | null | undefined): boolean {
  if (!sessions?.length) return true;
  const first = sessions.reduce((a, b) => (a.sessionNumber < b.sessionNumber ? a : b));
  return Date.now() < vnSessionTime(first.studyDate, first.startTime).getTime();
}

/** Vòng đời lớp theo lịch buổi học: Upcoming / Ongoing / Completed. */
export function classLifecycle(sessions: SessionLike[] | null | undefined): string {
  if (!sessions?.length) return 'Upcoming';
  const sorted = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const now = Date.now();
  if (now < vnSessionTime(first.studyDate, first.startTime).getTime()) return 'Upcoming';
  if (now > vnSessionTime(last.studyDate, last.endTime).getTime()) return 'Completed';
  return 'Ongoing';
}

/** "19:00:00" → "19:00". */
export function hhmm(t: string | null | undefined): string {
  return (t ?? '').slice(0, 5);
}

export function timeRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start && !end) return '—';
  return `${hhmm(start)} – ${hhmm(end)}`;
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "2026-10-23" → "Fri 23/10" (đọc theo ngày lịch, không đổi múi giờ). */
export function dayLabel(studyDate: string | null | undefined): string {
  if (!studyDate) return '';
  const [y, m, d] = studyDate.substring(0, 10).split('-').map(Number);
  if (!y || !m || !d) return studyDate;
  const date = new Date(y, m - 1, d);
  return `${WD[date.getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

/** "Monday" → "Mon". */
export function shortDay(day: string | null | undefined): string {
  return (day ?? '').slice(0, 3);
}

export function money(v: number | null | undefined): string {
  const n = Number(v ?? 0);
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}
