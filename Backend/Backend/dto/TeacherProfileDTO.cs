namespace Backend.DTO
{
    public class TeacherProfileDTO
    {
        public int TeacherProfileId { get; set; }

        public int UserId { get; set; }

        public string? TeacherName { get; set; }

        public string? Country { get; set; }

        public string? AvatarUrl { get; set; }

        public string? IntroVideoUrl { get; set; }

        public string? Specialty { get; set; }

        public int ExperienceYears { get; set; }

        public string? Description { get; set; }

        public string? EnglishCertificateUrl { get; set; }

        public decimal DesiredPricePerHour { get; set; }

        public decimal? ApprovedPricePerHour { get; set; }

        public decimal RatingAverage { get; set; }

        public int TotalReviews { get; set; }

        public byte Status { get; set; }

        public string? AdminNote { get; set; }

        public string? ApprovedBy { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }
    }
}