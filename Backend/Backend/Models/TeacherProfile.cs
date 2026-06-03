namespace Backend.Models
{
    public class TeacherProfile
    {
        public int TeacherProfileId { get; set; }

        public int UserId { get; set; }

        public string IntroVideoUrl { get; set; }

        public string Specialty { get; set; }

        public int ExperienceYears { get; set; }

        public decimal RatingAverage { get; set; } = 0;

        public int TotalReviews { get; set; } = 0;

        public string Description { get; set; }

        public byte Status { get; set; } = 0;

        public string EnglishCertificateUrl { get; set; }

        public string? AdminNote { get; set; }

        public decimal DesiredPricePerHour { get; set; }

        public decimal? ApprovedPricePerHour { get; set; }

        public string? ApprovedBy { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }

        public User? User { get; set; }
    }
}