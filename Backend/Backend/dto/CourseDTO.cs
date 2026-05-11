namespace Backend.dto
{
    public class CourseDTO
    {
        public int CourseId { get; set; }
        public int LevelId { get; set; }
        public string CourseName { get; set; }
        public string Description { get; set; }
        public int OrderIndex { get; set; }
        public bool IsActive { get; set; }
        public string? CreatedBy { get; set; }
        public bool? Status { get; set; }
        public bool IsDelete { get; set; }
        public List<UnitDTO> Units { get; set; } = new();


    }
}
