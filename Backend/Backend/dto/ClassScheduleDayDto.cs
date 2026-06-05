namespace Backend.dto
{
    public class ClassScheduleDayDto
    {
        public int Id { get; set; }

        public int ClassId { get; set; }

        public string DayOfWeek { get; set; } = string.Empty;
    }
}