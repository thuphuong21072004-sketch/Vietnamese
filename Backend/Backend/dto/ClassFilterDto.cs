namespace Backend.dto
{
    public class ClassFilterDto
    {
        public string? Country { get; set; }
        public decimal? MinRating { get; set; }

        public string? MainTopic { get; set; }

        public string? SubTopic { get; set; }

        public decimal? MinPrice { get; set; }

        public decimal? MaxPrice { get; set; }

        public DateTime? StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public TimeSpan? StartTime { get; set; }

        public TimeSpan? EndTime { get; set; }
        public List<string>? DaysOfWeek { get; set; }

    }
}
