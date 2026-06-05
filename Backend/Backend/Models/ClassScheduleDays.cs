namespace Backend.Models
{
    public class ClassScheduleDay
    {
        public int Id { get; set; }

        public int ClassId { get; set; }

        public string DayOfWeek { get; set; } = string.Empty;

        public TeacherClass? TeacherClass { get; set; }
    }
}