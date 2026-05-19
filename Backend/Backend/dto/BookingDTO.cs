namespace Backend.dto
{
    public class BookingDTO
    {
        public int BookingId { get; set; }

        public string? StudentName { get; set; }

        public string?TeacherName { get; set; }

        public int AvailabilityId { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public int Status { get; set; }

        public DateTime CreatedDate { get; set; }
    }
}