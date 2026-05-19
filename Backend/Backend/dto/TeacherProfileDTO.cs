namespace Backend.dto
{
    public class TeacherProfileDTO
    {
        public int TeacherProfileId { get; set; }

        public int UserId { get; set; }

        public string? IntroVideoUrl { get; set; }

        public string? Specialty { get; set; }

        public int ExperienceYears { get; set; }

        public decimal PricePerHour { get; set; }

        public decimal RatingAverage { get; set; }

        public int TotalReviews { get; set; }

        public string? Description { get; set; }
        public int Status { get; set; }
        public UserDTO? User { get; set; }
    }
}