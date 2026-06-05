namespace Backend.Models
{
    public class Review
    {
        public int ReviewId { get; set; }

        public int RefId { get; set; }
        public string RefName { get; set; }
        public int StudentId { get; set; }

        public int InstructorId { get; set; }

        public int Rating { get; set; }

        public string? Comment { get; set; }

        public string? Reply { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public User? Student { get; set; }

        public User? Instructor { get; set; }
    }
}