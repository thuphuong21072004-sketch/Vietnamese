/** Helper dùng chung cho nhóm 4 (gia sư 1-1) — logic lấy từ web (MyBookings / BookingDetail / VideoRoom). */

const MIN = 60 * 1000;

/** Khung giờ vào phòng: mở 30' trước giờ học → đóng 15' sau khi kết thúc. */
export function joinWindow(startTime: string | Date, endTime: string | Date) {
  const openAt = new Date(new Date(startTime).getTime() - 30 * MIN);
  const closeAt = new Date(new Date(endTime).getTime() + 15 * MIN);
  return { openAt, closeAt };
}

export function inJoinWindow(startTime: string | Date, endTime: string | Date): boolean {
  const { openAt, closeAt } = joinWindow(startTime, endTime);
  const now = new Date();
  return now >= openAt && now <= closeAt;
}

/** Link phòng học: joinUrl → roomCode là URL → Jitsi (theo MyBookings web). */
export function roomUrlOf(room: any): string | null {
  if (!room) return null;
  if (room.joinUrl) return room.joinUrl;
  if (!room.roomCode) return null;
  if (String(room.roomCode).startsWith('http')) return room.roomCode;
  const token = room.token ? `?token=${encodeURIComponent(room.token)}` : '';
  return `https://meet.jit.si/${room.roomCode}${token}`;
}

/** Số giờ giữa 2 mốc, làm tròn 2 chữ số. */
export function durationHours(start: string | Date | null | undefined, end: string | Date | null | undefined): number {
  if (!start || !end) return 0;
  const diff = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
}

/** "1 hour" / "1.5 hours". */
export function hoursLabel(h: number): string {
  return h === 1 ? '1 hour' : `${h} hours`;
}

/** "$15.00" */
export function money(value: unknown): string {
  const n = Number(value ?? 0) || 0;
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Trạng thái thanh toán (Constant.StatusPayment): 0 Pending, 1 Success, 2 Failed, 3 Refunded, 4 Expired. */
export function paymentStatusText(status: number | null | undefined): string {
  switch (status) {
    case 0:
      return 'Pending';
    case 1:
      return 'Paid';
    case 2:
      return 'Failed';
    case 3:
      return 'Refunded';
    case 4:
      return 'Expired';
    default:
      return '';
  }
}

/** PaymentDTO.PaymentMethod: 0 Stripe, 1 chuyển khoản. */
export function paymentMethodText(method: number | null | undefined): string {
  switch (method) {
    case 0:
      return 'Card (Stripe)';
    case 1:
      return 'Bank Transfer';
    default:
      return '';
  }
}
