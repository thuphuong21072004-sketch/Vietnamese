namespace Backend.common
{
    public class Constant
    {
        /*
         * định nghĩa các vai trò người dùng trong hệ thống
         * 14/03/2026
         * thuphuong21072004
         */
        public class Role
        {
            public const string Admin = "Admin";
            public const string User = "User";
            public const string Moderator = "Moderator";
            public const string Teacher = "Teacher";
        }

        /*
         * key cho refType
         * 21/04/2026
         * thuphuong21072004
         */
        public class RefType
        {
            public const string Level = "LEVEL_JUMP";
            public const string Course = "COURSE_JUMP";
            public const string Unit = "UNIT";
            public const string Placement = "PLACEMENT";
        }
        /*
         * level
         * 22/04/2026
         * thuphuong21072004
         */
        public class Level
        {
            public const string LevelA1 = "A1";
            public const string LevelA2 = "A2";
            public const string LevelB1 = "B1";
            public const string LevelB2 = "B2";
            public const string LevelC1 = "C1";
            public const string LevelC2 = "C2";
        }
        /*
         * trạng thái đặt lịch
         * 15/04/2026
         * thuphuong21072007
         */
        public class StatusBooking
        {
            /*
             * Chờ thanh toán
             * Đã giữ chỗ nhưng chưa thanh toán
             */
            public const byte PendingPayment = 0;

            /*
             * Đã xác nhận
             * Thanh toán thành công, chờ đến giờ học
             */
            public const byte Confirmed = 1;

            /*
             * Đang diễn ra
             * Buổi học đang diễn ra
             */
            public const byte InProgress = 2;

            /*
             * Đã hoàn thành
             * Buổi học kết thúc thành công
             */
            public const byte Completed = 3;

            /*
             * Đã hủy
             * Buổi học bị hủy
             */
            public const byte Cancelled = 4;

            /*
             * Đã hoàn tiền
             * Học viên đã được hoàn tiền
             */
            public const byte Refunded = 5;
        }
        /*
         * trạng thái thanh toán
         */
        public class StatusPayment
        {
            public const byte Pending = 0;

            public const byte Success = 1;

            public const byte Failed = 2;

            public const byte Refunded = 3;

            public const byte Expired = 4;
        }
        public class PaymentMethod
        {
            public const byte VNPay = 0;

            public const byte Momo = 1;

            public const byte Paypal = 2;
        }
        /*
         * trạng thái hồ sơ giáo viên
         */
        public class StatusTeacherProfile
        {
            public const byte Created = 0;

            public const byte Submitted = 1;

            public const byte ApprovedAdmin = 2;

            public const byte RejectedAdmin = 3;
            public const byte ApprovedTeacher=4;
            public const byte RejectedTeacher=5;
            public const byte Banned = 6;

        }
        public class StatusTeacherAvailability
        {
            /*
             * còn trống
             */
            public const byte Available = 0;

            /*
             * đã được đặt
             */
            public const byte Booked = 1;

            /*
             * quá hạn
             */
            public const byte Expired = 2;
        }
        /*
         * quyền tham gia phòng học online
         * 26/05/2026
         * thuphuong21072004
         */
        public class VideoRoomRole
        {
            public const string Host = "HOST";

            public const string Student = "STUDENT";
        }

    }
}
