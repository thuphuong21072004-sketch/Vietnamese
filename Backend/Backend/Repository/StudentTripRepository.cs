using Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Backend.Repository
{
    public interface StudentTripRepository
    {
        Task<StudentTrip?> GetById(
            int tripId);

        Task<List<StudentTrip>>
            GetByStudentId(
                int studentId);

        Task<List<StudentTrip>>
            GetSuggestedStudents(
                string destination,
                DateOnly availableFrom,
                DateOnly availableTo);

        Task<List<StudentTrip>>
            GetAllOpen(string? destination);

        Task Create(
            StudentTrip trip);

        Task Update(
            StudentTrip trip);

        Task Delete(
            StudentTrip trip);

        Task Save();
    }
}
