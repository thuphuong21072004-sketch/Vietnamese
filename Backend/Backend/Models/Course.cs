using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Course
    {
        public int CourseId { get; set; }
        public int LevelId { get; set; }

        public string CourseName { get; set; } = string.Empty;
        public string? Description { get; set; }

        public int OrderIndex { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public bool IsActive { get; set; }

        public Level? Level { get; set; }
        public ICollection<Unit>? Units { get; set; }
    }
}
