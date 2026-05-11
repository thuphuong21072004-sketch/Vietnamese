namespace Backend.dto
{
    public class PartDTO
    {
        public int PartId { get; set; }

        public int PartNumber { get; set; }

        public string PartName { get; set; } = string.Empty;

        public string? Instruction { get; set; }
        public bool IsDelete { get; set; }
        public List<QuestionDTO>? Questions { get; set; }

        public List<PassageDTO>? Passages { get; set; }
    }
}