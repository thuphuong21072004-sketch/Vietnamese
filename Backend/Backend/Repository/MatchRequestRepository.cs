using Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Backend.Repository
{
    public interface MatchRequestRepository
    {
        Task<MatchRequest?> GetById(
            int requestId);

        Task<MatchRequest?> GetByScheduleAndTrip(
            int scheduleId,
            int tripId);

        Task<List<MatchRequest>>
            GetByTeacherId(
                int teacherId);

        Task<List<MatchRequest>>
            GetByStudentId(
                int studentId);

        Task<List<MatchRequest>>
            GetPendingByTeacherId(
                int teacherId);

        Task<List<MatchRequest>>
            GetPendingByStudentId(
                int studentId);

        Task<List<MatchRequest>>
            GetByScheduleId(
                int scheduleId);

        Task<List<MatchRequest>>
            GetByTripId(
                int tripId);

        Task Create(
            MatchRequest request);

        Task Update(
            MatchRequest request);

        Task Delete(
            MatchRequest request);

        Task Save();
    }
}
