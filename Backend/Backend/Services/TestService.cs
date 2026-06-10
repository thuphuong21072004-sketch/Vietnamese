using Backend.dto;

namespace Backend.Services
{
    public interface TestService
    {
        Task<QuizDTO?> GetQuiz(int refId, string refType);
        Task SaveQuiz(QuizDTO dto);
        Task DeleteQuiz(int quizId);
        Task SubmitQuiz(SubmitQuizDTO dto);
        Task StartLearning(int quizId);
        Task<UserQuizDTO?> GetMyQuizResult(int quizId);
        Task<List<UserAnswerDTO>> GetUserAnswerRaw(int quizId);
        Task<List<PlacementTestDTO>> GetPlacements();
        Task<PlacementTestDTO> SavePlacement(PlacementTestDTO dto);
        Task DeletePlacement(int id);
    }
}