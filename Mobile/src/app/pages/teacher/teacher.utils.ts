/** Hàm dùng chung cho nhóm 8 · Giáo viên (lấy logic từ web: core/utils/vn-time.ts, các component ViewAdmin). */
import { VIETNAM_DESTINATIONS } from '@web/models/vietnam-destinations';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Ngày hôm nay theo lịch VN (+ số ngày), dạng yyyy-MM-dd. */
export function vnDateString(addDays = 0): string {
  const vn = new Date(Date.now() + VN_OFFSET_MS);
  vn.setUTCDate(vn.getUTCDate() + addDays);
  return vn.toISOString().substring(0, 10);
}

/** Giờ buổi học nhóm lưu theo giờ VN (UTC+7) → luôn gắn +07:00 khi đổi sang Date. */
export function vnSessionTime(studyDate: string | null | undefined, time: string | null | undefined): Date {
  if (!studyDate || !time) return new Date(NaN);
  const hhmmss = time.length > 8 ? time.substring(0, 8) : time;
  return new Date(`${studyDate.substring(0, 10)}T${hhmmss}+07:00`);
}

/** "19:00:00" → "19:00" */
export function hhmm(t: string | null | undefined): string {
  return (t ?? '').slice(0, 5);
}

/** "2026-11-02..." → "02/11/2026" */
export function dmy(d: string | null | undefined): string {
  if (!d) return '';
  const [y, m, day] = d.substring(0, 10).split('-');
  return `${day}/${m}/${y}`;
}

/** Trạng thái vòng đời lớp: Upcoming / Ongoing / Completed (theo buổi đầu – buổi cuối). */
export function classLifecycle(sessions: { studyDate: string; startTime: string; endTime: string }[] | null | undefined): string {
  if (!sessions?.length) return 'Upcoming';
  const now = new Date();
  const sorted = [...sessions].sort(
    (a, b) => a.studyDate.localeCompare(b.studyDate) || a.startTime.localeCompare(b.startTime),
  );
  const first = vnSessionTime(sorted[0].studyDate, sorted[0].startTime);
  const last = sorted[sorted.length - 1];
  const lastEnd = vnSessionTime(last.studyDate, last.endTime);
  if (now < first) return 'Upcoming';
  if (now > lastEnd) return 'Completed';
  return 'Ongoing';
}

/** "Monday" → "Mon" */
export function shortDay(day: string | null | undefined): string {
  return (day ?? '').slice(0, 3);
}

export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const MAIN_TOPICS = ['Daily Communication', 'Work', 'Study', 'Travel', 'Exam Preparation', 'Vietnamese Culture'];

export const SUB_TOPICS: Record<string, string[]> = {
  'Daily Communication': [
    'Beginner Vietnamese',
    'Basic Communication',
    'Intermediate Communication',
    'Advanced Communication',
    'Living in Vietnam',
    'Daily Life in Vietnam',
    'Practical Vietnamese',
    'Vietnamese for Foreigners',
    'Social Communication',
    'Community Communication',
  ],
  Work: [
    'Office Vietnamese',
    'Business Vietnamese',
    'Vietnamese for IT Professionals',
    'Vietnamese for Engineers',
    'Vietnamese for Doctors',
    'Vietnamese for Nurses',
    'Vietnamese for Teachers',
    'Vietnamese for Office Workers',
    'Vietnamese for Hotel Staff',
    'Vietnamese for Restaurant Staff',
    'Vietnamese for Sales',
    'Vietnamese for Customer Service',
    'Professional Vietnamese',
    'Management Communication',
    'Startup Communication',
  ],
  Study: [
    'Vietnamese for Children',
    'Vietnamese for Teenagers',
    'Vietnamese for Students',
    'Vietnamese for International Students',
    'Academic Vietnamese',
    'University Vietnamese',
    'Research Vietnamese',
    'Reading Skills',
    'Listening Skills',
    'Speaking Skills',
    'Writing Skills',
    'Vietnamese Grammar',
    'Vietnamese Vocabulary',
    'Advanced Vietnamese',
    'University Preparation',
  ],
  Travel: [
    'Hanoi',
    'Ha Long Bay',
    'Sapa',
    'Ha Giang',
    'Ninh Binh',
    'Moc Chau',
    'Hue',
    'Da Nang',
    'Hoi An',
    'Phong Nha',
    'Quang Binh',
    'Nha Trang',
    'Da Lat',
    'Mui Ne',
    'Phan Thiet',
    'Ho Chi Minh City',
    'Can Tho',
    'Chau Doc',
    'An Giang',
    'Phu Quoc',
    'Con Dao',
  ],
  'Exam Preparation': [
    'A1 Preparation',
    'A2 Preparation',
    'B1 Preparation',
    'B2 Preparation',
    'C1 Preparation',
    'C2 Preparation',
    'Listening Practice',
    'Speaking Practice',
    'Reading Practice',
    'Writing Practice',
    'Comprehensive Review',
    'Test-taking Strategies',
  ],
  'Vietnamese Culture': [
    'Vietnamese Cuisine',
    'Vietnamese History',
    'Customs and Traditions',
    'Traditional Festivals',
    'Tet Holiday',
    'Communication Etiquette',
    'Vietnamese Family Culture',
    'Traditional Clothing',
    'Vietnamese Music',
    'Vietnamese Cinema',
    'Vietnamese Literature',
    'Vietnamese Lifestyle',
    'Northern Culture',
    'Central Culture',
    'Southern Culture',
  ],
};

export const DESTINATIONS = VIETNAM_DESTINATIONS;

export function spotsOf(province: string | null | undefined): string[] {
  return VIETNAM_DESTINATIONS.find((g) => g.province === province)?.spots ?? [];
}

/** Trạng thái lời mời du lịch. */
export function requestStatusLabel(status: number): string {
  return ({ 0: 'Pending', 1: 'Accepted', 2: 'Rejected', 3: 'Cancelled' } as Record<number, string>)[status] ?? '';
}

export function tripStatusLabel(status: number): string {
  return ({ 0: 'Finding Teacher', 1: 'Matched', 2: 'Cancelled' } as Record<number, string>)[status] ?? '';
}

/** Link phòng học từ kết quả tạo phòng (giống getRoomUrl của web). */
export function roomUrlOf(room: any): string | null {
  if (!room) return null;
  if (room.joinUrl) return room.joinUrl;
  if (!room.roomCode) return null;
  if (String(room.roomCode).startsWith('http')) return room.roomCode;
  const token = room.token ? `?token=${encodeURIComponent(room.token)}` : '';
  return `https://meeting.example.com/${room.roomCode}${token}`;
}

/** Icon dùng riêng trong nhóm giáo viên (Lucide). */
export const T_ICONS = {
  plus: 'M12 5v14M5 12h14',
  close: 'M18 6 6 18M6 6l12 12',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  video: 'M23 7l-7 5 7 5zM1 5h15v14H1z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
  swap: 'M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  plane: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
  handshake: 'M11 17l2 2a1 1 0 1 0 3-3M14 14l2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4M21 3l1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  school: 'M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 3 9 3 12 0v-5',
};
