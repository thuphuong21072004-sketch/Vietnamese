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

        public byte Status { get; set; }

        public DateTime CreatedDate { get; set; }
        public string? TeacherName { get; set; }
        public string? Country { get; set; }
        public string? AvatarUrl { get; set; }
    }
}