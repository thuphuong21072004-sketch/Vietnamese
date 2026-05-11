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
    }
}
