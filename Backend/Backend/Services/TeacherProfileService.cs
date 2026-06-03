using Backend.dto;
using Backend.DTO;

namespace Backend.Services
{
    public interface TeacherProfileService
    {
        Task<TeacherProfileDTO?> GetMyProfile();
        Task CreateProfile(TeacherProfileDTO dto);
        Task UpdateProfile(TeacherProfileDTO dto);
        Task SubmitProfile();
        Task ApprovedAdmin(int id, decimal approvedPrice, string? note);
        Task RejectedAdmin(int id, string note);
        Task ApprovedTeacher();
        Task RejectedTeacher();
        Task BanTeacher(int id, string reason);

        Task<List<TeacherProfileDTO>> GetAllTeachers(int? status);
        Task<TeacherProfileDTO?> GetDetailForAdmin( int id);
        Task<TeacherProfileDTO?> GetDetailForStudent(int id);
    }
}