namespace Backend.Models
{
    public class Part
    {
        public int PartId { get; set; }
        public int QuizId { get; set; }
        public string PartName { get; set; }
        public int PartNumber { get; set; }
        public string? Instruction { get; set; }
        public ICollection<Passage> Passages { get; set; } 
        public ICollection<Question> Questions { get; set; }
        public Quiz Quiz { get; set; }
    }
}
