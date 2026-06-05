namespace Backend.dto
{
    public class ClassEnrollmentDto
    {
        public int EnrollmentId { get; set; }

        public int ClassId { get; set; }

        public int StudentId { get; set; }

        public int Status { get; set; }

        public DateTime EnrolledDate { get; set; }
    }
}