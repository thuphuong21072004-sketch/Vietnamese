using Backend.dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Backend.Services
{
    public interface TravelService
    {
        // teacher schedule

        Task<TeacherScheduleDto> CreateTeacherSchedule( TeacherScheduleDto dto);

        Task<TeacherScheduleDto> UpdateTeacherSchedule( int scheduleId, TeacherScheduleDto dto);

        Task DeleteTeacherSchedule( int scheduleId);

        Task<List<TeacherScheduleDto>> GetMyTeacherSchedules();



        // student trip

        Task<StudentTripDto> CreateTrip( StudentTripDto dto);

        Task<StudentTripDto> UpdateTrip( int tripId, StudentTripDto dto);

        Task DeleteTrip( int tripId);

        Task<List<StudentTripDto>> GetMyTrips();



        // matching

        Task<List<TeacherScheduleDto>> GetSuggestedTeachers( int tripId);

        Task<List<StudentTripDto>> GetSuggestedStudents( int scheduleId);



        // request

        Task SendRequest( int scheduleId, int tripId, byte requestType);

        Task AcceptRequest( int requestId);

        Task RejectRequest( int requestId);

        Task CancelRequest( int requestId);



        // request list

        Task<List<MatchRequestDto>> GetIncomingRequests();

        Task<List<MatchRequestDto>> GetOutgoingRequests();

        Task<MatchRequestDto?> GetRequestDetail(
                int requestId);
        Task<List<MatchRequestDto>>GetRequestsByTrip( int tripId);
        Task<List<MatchRequestDto>>GetRequestsBySchedule( int scheduleId);

        Task LinkClass(int requestId, int classId);
    }
}
