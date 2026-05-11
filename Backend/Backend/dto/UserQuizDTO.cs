namespace Backend.dto
{
    public class UserQuizDTO
    {
        public int UserQuizId { get; set; }

        public int UserId { get; set; }

        public int QuizId { get; set; }

        public decimal Score { get; set; }

        public DateTime CompletedDate { get; set; }

        public bool IsPassed { get; set; }

    }
}