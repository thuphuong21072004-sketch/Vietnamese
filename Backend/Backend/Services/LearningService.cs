using Backend.dto;
using Backend.Models;

namespace Backend.Services
{
    public interface LearningService
    {
        Task<List<LevelDTO>> GetLevels();
        Task<LevelDTO?> GetLevelById(int levelId);
        Task SaveLevels(List<LevelDTO> list);

        Task<List<CourseDTO>> GetCourses(int levelId);
        Task<CourseDTO?> GetCourseById(int courseId);
        Task SaveCourses(List<CourseDTO> list);

        Task<List<UnitDTO>> GetUnits(int courseId);
        Task<UnitDTO?> GetUnitById(int UnitId);
        Task SaveUnit(UnitDTO dto);
        Task DeleteUnits(List<int> UnitIds);

        Task<object> GetMyProgress();


    }
}
