namespace Backend.common
{
    /*
     * múi giờ của người đang gọi API (header X-Timezone-Offset, phút lệch so với UTC, vd VN = 420)
     * dùng cho mọi thứ người dùng nhìn theo lịch của họ: lọc theo ngày, thống kê theo tháng
     * không có header → mặc định giờ Việt Nam
     *
     * dữ liệu "giờ Việt Nam" cố định (buổi học nhóm, ngày chuyến đi) vẫn dùng VnTime
     */
    public static class UserTime
    {
        public const string HeaderName = "X-Timezone-Offset";

        // giới hạn múi giờ thực tế: UTC-12 .. UTC+14
        private const int MinOffsetMinutes = -12 * 60;
        private const int MaxOffsetMinutes = 14 * 60;

        // AsyncLocal → mỗi request một giá trị, chảy theo các lời gọi async bên trong request
        private static readonly AsyncLocal<TimeSpan?> CurrentOffset = new();

        public static TimeSpan Offset => CurrentOffset.Value ?? VnTime.Offset;

        public static void SetForCurrentRequest(string? headerValue)
        {
            CurrentOffset.Value =
                int.TryParse(headerValue, out var minutes)
                && minutes >= MinOffsetMinutes
                && minutes <= MaxOffsetMinutes
                    ? TimeSpan.FromMinutes(minutes)
                    : null;
        }

        public static DateTime ToUser(DateTime utc) => utc + Offset;

        public static DateOnly UserDate(DateTime utc) => DateOnly.FromDateTime(ToUser(utc));

        public static DateOnly Today => UserDate(DateTime.UtcNow);

        /*
         * khoảng UTC [from, to) tương ứng một ngày theo lịch của người dùng
         */
        public static (DateTime From, DateTime To) UtcRangeOf(DateOnly userDate)
        {
            var from = userDate.ToDateTime(TimeOnly.MinValue) - Offset;
            return (from, from.AddDays(1));
        }
    }
}
