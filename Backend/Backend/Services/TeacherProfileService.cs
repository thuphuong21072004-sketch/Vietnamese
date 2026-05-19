using Backend.dto;

namespace Backend.Services
{
    public interface TeacherProfileService
    {
        Task<TeacherProfileDTO?> GetMyProfile();
        Task CreateProfile(TeacherProfileDTO dto);
        Task UpdateProfile(TeacherProfileDTO dto);
        Task UpdateStatus(int id, int status);
        Task<List<TeacherProfileDTO>> GetAllTeachers(int? status);
        Task<TeacherProfileDTO?>GetDetail(int id);
    }
}