using Backend.dto;

namespace Backend.Services
{
    public interface TeacherClassService
    {
        Task<decimal> CalculateMaxPrice(TeacherClassDto dto);
        Task<List<ClassSessionDto>> GenerateSchedule( TeacherClassDto dto);

        Task<TeacherClassDto> CreateAsync(
            TeacherClassDto dto);
        Task<List<TeacherClassDto>> SearchMyClassesAsync(
        ClassFilterDto filter);

        Task<List<TeacherClassDto>> SearchClassesAsync(
        ClassFilterDto filter);

        Task<TeacherClassDto> GetClassDetailAsync( int classId);

        Task DeleteClassAsync( int classId);

        Task UpdateSessionsAsync( int classId, List<ClassSessionDto> sessions);
    }
}