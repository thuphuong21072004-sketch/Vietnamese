using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Unit
    {
        public int UnitId { get; set; }
        public int CourseId { get; set; }

        public string UnitName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Objective { get; set; }

        public string? VideoUrl { get; set; }
        public int Duration { get; set; }

        public int OrderIndex { get; set; }
        public DateTime CreatedDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public Course? Course { get; set; }
    }
}
