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
            public const byte Pending = 0;

            public const byte Booked = 1;

            public const byte Cancelled = 2;

            public const byte Completed = 3;
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
        /*
         * trạng thái hồ sơ giáo viên
         */
        public class StatusTeacherProfile
        {
            public const byte Draft = 0;
            public const byte Pending = 1;

            public const byte Approved = 2;

            public const byte Rejected = 3;
        }
       

    }
}
