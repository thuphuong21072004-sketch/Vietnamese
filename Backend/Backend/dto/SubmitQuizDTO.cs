namespace Backend.dto
{
    public class SubmitQuizDTO
    {
        public int QuizId { get; set; }

        public List<int> AnswerIds
        { get; set; } = new();
    }
}