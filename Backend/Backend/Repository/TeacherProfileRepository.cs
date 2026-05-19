using Backend.Models;

namespace Backend.Repository
{
    public interface TeacherProfileRepository
    {
        Task<TeacherProfile?> GetByUserId(int userId);
        Task<TeacherProfile?> GetById(int id);
        Task Create(TeacherProfile teacherProfile);

        Task Update(TeacherProfile teacherProfile);
        Task<List<TeacherProfile>> GetAllForAdmin(int? status);
        Task<TeacherProfile?> GetDetail(int id);
        Task Save();
    }
}