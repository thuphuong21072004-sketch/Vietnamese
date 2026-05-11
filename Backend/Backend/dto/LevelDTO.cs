namespace Backend.dto
{
    public class LevelDTO
    {
        public int LevelId { get; set; }
        public string LevelName { get; set; }
        public string Description { get; set; }
        public int OrderIndex { get; set; }
        public bool IsActive { get; set; }
        public bool? Status { get; set; }
        public bool IsDelete { get; set; }
        public List<CourseDTO> Courses { get; set; } = new();


    }
}
