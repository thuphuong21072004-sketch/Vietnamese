using Backend.Models;

namespace Backend.Repository
{
    public interface CourseRepository
    {
        Task<List<Course>> GetAllCourses(int levelId, bool? isActive);
       
        Task AddCourse(Course course);
        Task UpdateCourse(Course course);
        Task DeleteCourses(List<int> ids);
        Task SaveCourse();
        Task<int> GetMaxOrderIndex(int levelId);
        Task<Course?> GetNextCourse(int courseId);
        Task<Course?> GetCourseById(int id);

    }
}
