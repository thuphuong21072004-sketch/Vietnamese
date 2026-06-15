namespace Backend.dto
{
    public class TravelBookingAdminDto
    {
        public int TravelBookingId { get; set; }

        public string Destination { get; set; } = string.Empty;

        public string? SpecificLocation { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }

        public byte Status { get; set; }

        public DateTime CreatedAt { get; set; }

        public string TeacherName { get; set; } = string.Empty;

        public string? TeacherEmail { get; set; }

        public string? TeacherPhone { get; set; }

        public string? TeacherCountry { get; set; }

        public string StudentName { get; set; } = string.Empty;

        public string? StudentPhone { get; set; }

        public string? StudentEmail { get; set; }

        public string? StudentCountry { get; set; }
    }
}
