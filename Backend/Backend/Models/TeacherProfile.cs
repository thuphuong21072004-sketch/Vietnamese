namespace Backend.Models
{
    public class TeacherProfile
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

        public User? User { get; set; }
    }
}