/** Tiện ích dùng chung cho các màn Du lịch (nhóm 6). */

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** "yyyy-MM-dd" theo lịch Việt Nam (+addDays) — cùng quy tắc với web/backend. */
export function vnDateString(addDays = 0): string {
  const vn = new Date(Date.now() + VN_OFFSET_MS);
  vn.setUTCDate(vn.getUTCDate() + addDays);
  return vn.toISOString().substring(0, 10);
}

/** Tách "yyyy-MM-dd..." thành [yyyy, MM, dd] mà không lệch múi giờ. */
function parts(d: string | null | undefined): [string, string, string] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d ?? '');
  return m ? [m[1], m[2], m[3]] : null;
}

/** "28/11 – 05/12/2026" (cùng năm) hoặc "28/12/2026 – 05/01/2027". */
export function dateRange(start: string | null | undefined, end: string | null | undefined, withYear = true): string {
  const a = parts(start);
  const b = parts(end);
  if (!a || !b) return '';
  if (!withYear) return `${a[2]}/${a[1]} – ${b[2]}/${b[1]}`;
  if (a[0] === b[0]) return `${a[2]}/${a[1]} – ${b[2]}/${b[1]}/${b[0]}`;
  return `${a[2]}/${a[1]}/${a[0]} – ${b[2]}/${b[1]}/${b[0]}`;
}

/** Icon dùng ở màn Du lịch (Lucide). */
export const TRAVEL_ICONS = {
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
  plus: 'M12 5v14M5 12h14',
  swap: 'M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  chevronRight: 'm9 18 6-6-6-6',
  close: 'M18 6 6 18M6 6l12 12',
};
