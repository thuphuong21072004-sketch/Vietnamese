using Backend.Models;

namespace Backend.Repository
{
    public interface ProgressRepository
    {

        Task<UserProgress?> GetUserLevel(int userId, int levelId, string refType);
        Task<UserProgress?> GetUserCourseByCourseId(int userId, int courseId, string refType);
        Task<List<UserProgress>> GetUserUnits(int userId, int courseId, string refType);
        Task<UserProgress?> GetCurrentProgress(int userId, string refType);
        Task AddUserLevel(int userId, int levelId, string refType);
        Task AddUserCourse(int userId, int courseId, string refType);
        Task AddUserProgress(UserProgress userProgress);
        Task Save();

        Task<List<UserProgress>> GetUserCourses(int userId, int levelId, string refType);
        Task<UserProgress?> GetUserUnitByUnitId(int userId, int unitId, string refType);
        Task<List<UserProgress>> GetUserProgress(int userId, int courseId, string refType);
        Task<bool> HasUserProgress(int userId, string refType);
        Task<UserProgress?> GetUserProgress(int userId, string refType, int refId);
        Task<List<UserProgress>> GetUserLevels(int userId, string refType );
        Task UpdateUserProgress(UserProgress progress);

    }
}
