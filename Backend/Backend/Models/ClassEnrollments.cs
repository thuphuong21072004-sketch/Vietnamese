namespace Backend.Models
{
    public class ClassEnrollment
    {
        public int EnrollmentId { get; set; }

        public int ClassId { get; set; }

        public int StudentId { get; set; }

        public byte Status { get; set; }

        public DateTime EnrolledDate { get; set; }

        public TeacherClass? TeacherClass { get; set; }

        public User? Student { get; set; }
        
    }
}