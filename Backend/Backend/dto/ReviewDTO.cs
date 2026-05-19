namespace Backend.dto
{
    public class ReviewDTO
    {
        public int ReviewId { get; set; }

        public int BookingId { get; set; }

        public string? StudentName { get; set; }

        public string? TeacherName { get; set; }

        public int Rating { get; set; }

        public string? Comment { get; set; }

        public DateTime CreatedDate { get; set; }
    }
}