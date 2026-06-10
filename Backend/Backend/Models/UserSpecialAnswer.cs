namespace Backend.Models
{
    public class UserSpecialAnswer
    {
        public int UserSpecialAnswerId { get; set; }
        public int UserQuizId { get; set; }
        public int QuestionId { get; set; }
        public string? WrittenText { get; set; }
        public decimal? SpeakScore { get; set; }
        public bool IsCorrect { get; set; }
        public decimal Score { get; set; }

        public UserQuiz? UserQuiz { get; set; }
        public Question? Question { get; set; }
    }
}
