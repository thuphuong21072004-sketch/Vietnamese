const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/*
 * ngày hôm nay theo lịch Việt Nam (+ số ngày), dạng "yyyy-MM-dd"
 * dùng cho các ngày quy định theo lịch VN (vd ngày chuyến đi) — giống VnTime.Today ở backend
 */
export function vnDateString(addDays = 0): string {
  const vn = new Date(Date.now() + VN_OFFSET_MS);
  vn.setUTCDate(vn.getUTCDate() + addDays);
  return vn.toISOString().substring(0, 10);
}

/*
 * giờ buổi học nhóm (ClassSessions.studyDate + startTime/endTime) được lưu theo giờ Việt Nam (UTC+7),
 * không phải giờ máy người xem → luôn gắn +07:00 khi đổi sang Date
 * thiếu ngày / giờ → Invalid Date (giống new Date('...') trước đây, không ném lỗi trong template)
 */
export function vnSessionTime(
  studyDate: string | null | undefined,
  time: string | null | undefined,
): Date {
  if (!studyDate || !time) {
    return new Date(NaN);
  }
  // "07:00:00.0000000" (TimeSpan .NET) → "07:00:00"
  const hhmmss = time.length > 8 ? time.substring(0, 8) : time;
  return new Date(`${studyDate.substring(0, 10)}T${hhmmss}+07:00`);
}
