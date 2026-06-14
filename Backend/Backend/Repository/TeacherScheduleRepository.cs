using Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Backend.Repository
{
    public interface TeacherScheduleRepository
    {
        Task<TeacherSchedule?> GetById(
            int scheduleId);

        Task<List<TeacherSchedule>> GetByTeacherId(
            int teacherId);

        Task<List<TeacherSchedule>> GetAll();

        Task<List<TeacherSchedule>> GetSuggestedTeachers(
            string destination,
            DateOnly startDate,
            DateOnly endDate);

        Task Create(
            TeacherSchedule schedule);

        Task Update(
            TeacherSchedule schedule);

        Task Delete(
            TeacherSchedule schedule);

        Task Save();
    }
}
