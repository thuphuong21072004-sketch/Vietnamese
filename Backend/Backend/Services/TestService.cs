using Backend.dto;
using Backend.Models;

namespace Backend.Services
{
    public interface TestService
    {
        // lấy full quiz
        Task<QuizDTO?> GetQuiz(int refId, string refType);

        // thêm full quiz
        Task SaveQuiz(QuizDTO dto);

        // xóa quiz
        Task DeleteQuiz(int quizId);

        // nộp bài quiz
        Task SubmitQuiz(
            int quizId,
            List<int> answerIds);

        // lấy kết quả quiz của user
        Task<UserQuizDTO?> GetMyQuizResult(
            int quizId);

        // review đáp án user
        Task<List<UserAnswerDTO>>GetUserAnswerRaw(int quizId);

        // placement
        Task<List<PlacementTestDTO>>
            GetPlacements();

        Task<PlacementTestDTO> SavePlacement(PlacementTestDTO dto);

        Task DeletePlacement(int id);
    }
}
