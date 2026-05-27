namespace Backend.dto
{
    public class BookingDTO
    {
        public int BookingId { get; set; }

        public int StudentId { get; set; }

        public string? StudentName { get; set; }

        public int InstructorId { get; set; }

        public string? InstructorName { get; set; }

        public int AvailabilityId { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public decimal TotalPrice { get; set; }

        public string? Note { get; set; }

        
        public int Status { get; set; }

        public DateTime? CompletedAt { get; set; }

        public DateTime CreatedDate { get; set; }



        public UserDTO? Student { get; set; }

        public UserDTO? Instructor { get; set; }

        public TeacherAvailabilityDTO? Availability { get; set; }

        public PaymentDTO? Payment { get; set; }

        public VideoRoomDTO? VideoRoom { get; set; }

        public ReviewDTO? Review { get; set; }
    }
}