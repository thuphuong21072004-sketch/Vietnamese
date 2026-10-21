/**
 * Bảng màu trạng thái thống nhất (README §2.1 "Badge trạng thái").
 * Trả về modifier của .vp-badge: success | warning | danger | info | upcoming | violet | neutral | banned | orange.
 */
export type BadgeTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'upcoming'
  | 'violet'
  | 'neutral'
  | 'banned'
  | 'orange'
  | 'emerald'
  | 'tag';

const TONE_BY_LABEL: Record<string, BadgeTone> = {
  // Booking 1-1 / enrollment
  'pending payment': 'warning',
  pending: 'warning',
  confirmed: 'success',
  'in progress': 'info',
  completed: 'upcoming', // Completed của booking 1-1; lớp dùng toneForClass
  cancelled: 'danger',
  canceled: 'danger',
  refunded: 'violet',
  // Lớp nhóm
  upcoming: 'upcoming',
  ongoing: 'info',
  // Slot
  available: 'success',
  booked: 'warning',
  expired: 'danger',
  // Travel
  accepted: 'success',
  rejected: 'danger',
  matched: 'success',
  'finding teacher': 'info',
  open: 'success',
  closed: 'neutral',
  // Hồ sơ giáo viên
  draft: 'neutral',
  created: 'neutral',
  submitted: 'warning',
  'approved by admin': 'info',
  'rejected by admin': 'danger',
  'approved teacher': 'success',
  'rejected teacher': 'danger',
  'rejected by teacher': 'danger',
  banned: 'banned',
  // Khác
  active: 'success',
  inactive: 'danger',
  approved: 'success',
  passed: 'success',
  failed: 'danger',
  success: 'success',
  paid: 'success',
  owed: 'orange',
  overpaid: 'danger',
  settled: 'success',
};

export function toneOf(label: string | null | undefined): BadgeTone {
  if (!label) return 'neutral';
  return TONE_BY_LABEL[label.trim().toLowerCase()] ?? 'tag';
}

/** Trạng thái vòng đời lớp: Completed dùng màu success (khác booking 1-1). */
export function toneForClass(label: string | null | undefined): BadgeTone {
  return label?.trim().toLowerCase() === 'completed' ? 'success' : toneOf(label);
}
