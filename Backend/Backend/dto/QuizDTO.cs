namespace Backend.dto
{
    public class QuizDTO
    {
        public int QuizId { get; set; }

        public string RefType { get; set; } = string.Empty;

        public int RefId { get; set; }

        public string QuizName { get; set; } = string.Empty;

        public int? TimeLimit { get; set; }

        public decimal? PassScore { get; set; }
        public bool IsActive { get; set; }
        public List<PartDTO>? Parts { get; set; }
        public List<QuestionDTO>? Questions { get; set; }
    }
}