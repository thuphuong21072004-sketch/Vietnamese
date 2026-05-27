using Backend.dto;

namespace Backend.Services
{
    public interface TeacherAvailabilityService
    {

        Task<List<TeacherAvailabilityDTO>> GetAvailableSchedules( DateOnly? date);

        Task<List<TeacherAvailabilityDTO>>
GetMySchedules(
    byte? status,
    DateOnly? date);

        Task<TeacherAvailabilityDTO> GetDetail(int id);

        Task Create( TeacherAvailabilityDTO dto);

        Task Update( int id, TeacherAvailabilityDTO dto);

        Task Delete(int availabilityId);
    }
}