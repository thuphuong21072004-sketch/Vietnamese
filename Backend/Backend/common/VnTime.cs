namespace Backend.common
{
    /*
     * dữ liệu lưu theo giờ Việt Nam cố định (UTC+7): giờ buổi học nhóm (ClassSessions),
     * ngày chuyến đi du lịch (StudentTrips / TeacherSchedules) — không phụ thuộc người xem ở đâu
     * (lọc / thống kê theo lịch của người xem thì dùng UserTime)
     */
    public static class VnTime
    {
        public static readonly TimeSpan Offset = TimeSpan.FromHours(7);

        public static DateTime ToVn(DateTime utc) => utc + Offset;

        public static DateOnly VnDate(DateTime utc) => DateOnly.FromDateTime(ToVn(utc));

        public static DateOnly Today => VnDate(DateTime.UtcNow);
    }
}
