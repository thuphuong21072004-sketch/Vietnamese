using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/travel")]
    [Authorize]
    public class TravelController : ControllerBase
    {
        private readonly TravelService _travelService;

        public TravelController(TravelService travelService)
        {
            _travelService = travelService;
        }

        // ── Teacher Schedules ─────────────────────────────────────────────────

        [HttpPost("teacher/schedules")]
        public async Task<IActionResult> CreateSchedule([FromBody] TeacherScheduleDto dto)
        {
            var result = await _travelService.CreateTeacherSchedule(dto);
            return Ok(result);
        }

        [HttpGet("teacher/schedules")]
        public async Task<IActionResult> GetMySchedules()
        {
            var result = await _travelService.GetMyTeacherSchedules();
            return Ok(result);
        }

        [HttpPut("teacher/schedules/{id}")]
        public async Task<IActionResult> UpdateSchedule(int id, [FromBody] TeacherScheduleDto dto)
        {
            var result = await _travelService.UpdateTeacherSchedule(id, dto);
            return Ok(result);
        }

        [HttpDelete("teacher/schedules/{id}")]
        public async Task<IActionResult> DeleteSchedule(int id)
        {
            await _travelService.DeleteTeacherSchedule(id);
            return Ok();
        }

        // ── Student Trips ─────────────────────────────────────────────────────

        [HttpPost("student/trips")]
        public async Task<IActionResult> CreateTrip([FromBody] StudentTripDto dto)
        {
            var result = await _travelService.CreateTrip(dto);
            return Ok(result);
        }

        [HttpGet("student/trips")]
        public async Task<IActionResult> GetMyTrips()
        {
            var result = await _travelService.GetMyTrips();
            return Ok(result);
        }

        [HttpPut("student/trips/{id}")]
        public async Task<IActionResult> UpdateTrip(int id, [FromBody] StudentTripDto dto)
        {
            var result = await _travelService.UpdateTrip(id, dto);
            return Ok(result);
        }

        [HttpDelete("student/trips/{id}")]
        public async Task<IActionResult> DeleteTrip(int id)
        {
            await _travelService.DeleteTrip(id);
            return Ok();
        }

        // ── Matching ──────────────────────────────────────────────────────────

        [HttpGet("student/matches/{tripId}")]
        public async Task<IActionResult> GetSuggestedTeachers(int tripId)
        {
            var result = await _travelService.GetSuggestedTeachers(tripId);
            return Ok(result);
        }

        [HttpGet("teacher/matches/{scheduleId}")]
        public async Task<IActionResult> GetSuggestedStudents(int scheduleId)
        {
            var result = await _travelService.GetSuggestedStudents(scheduleId);
            return Ok(result);
        }

        [HttpGet("teacher/open-trips")]
        public async Task<IActionResult> GetOpenStudentTrips([FromQuery] string? destination)
        {
            var result = await _travelService.GetOpenStudentTrips(destination);
            return Ok(result);
        }

        [HttpGet("teacher/my-bookings")]
        public async Task<IActionResult> GetMyConfirmedBookings()
        {
            var result = await _travelService.GetMyConfirmedBookings();
            return Ok(result);
        }

        // ── Requests ──────────────────────────────────────────────────────────

        [HttpPost("requests")]
        public async Task<IActionResult> SendRequest([FromBody] SendTravelRequestDto dto)
        {
            await _travelService.SendRequest(dto.ScheduleId, dto.TripId, dto.RequestType);
            return Ok();
        }

        [HttpPost("requests/{id}/accept")]
        public async Task<IActionResult> AcceptRequest(int id)
        {
            await _travelService.AcceptRequest(id);
            return Ok();
        }

        [HttpPost("requests/{id}/reject")]
        public async Task<IActionResult> RejectRequest(int id)
        {
            await _travelService.RejectRequest(id);
            return Ok();
        }

        [HttpDelete("requests/{id}")]
        public async Task<IActionResult> CancelRequest(int id)
        {
            await _travelService.CancelRequest(id);
            return Ok();
        }

        [HttpGet("requests/incoming")]
        public async Task<IActionResult> GetIncomingRequests()
        {
            var result = await _travelService.GetIncomingRequests();
            return Ok(result);
        }

        [HttpGet("requests/outgoing")]
        public async Task<IActionResult> GetOutgoingRequests()
        {
            var result = await _travelService.GetOutgoingRequests();
            return Ok(result);
        }

        [HttpGet("requests/by-trip/{tripId}")]
        public async Task<IActionResult> GetRequestsByTrip(int tripId)
        {
            var result = await _travelService.GetRequestsByTrip(tripId);
            return Ok(result);
        }

        [HttpGet("requests/by-schedule/{scheduleId}")]
        public async Task<IActionResult> GetRequestsBySchedule(int scheduleId)
        {
            var result = await _travelService.GetRequestsBySchedule(scheduleId);
            return Ok(result);
        }

        [HttpGet("requests/{id}")]
        public async Task<IActionResult> GetRequestDetail(int id)
        {
            var result = await _travelService.GetRequestDetail(id);
            return Ok(result);
        }

        [HttpPut("requests/{id}/link-class/{classId}")]
        public async Task<IActionResult> LinkClass(int id, int classId)
        {
            await _travelService.LinkClass(id, classId);
            return Ok();
        }

        // ── Class reservation from trip ───────────────────────────────────────

        [HttpGet("teacher/reserved-class-map")]
        public async Task<IActionResult> GetMyReservedClassMap()
        {
            var result = await _travelService.GetMyReservedClassMap();
            return Ok(result);
        }

        [HttpPost("teacher/link-trip/{tripId}/class/{classId}")]
        public async Task<IActionResult> ReserveTripInClass(int tripId, int classId)
        {
            await _travelService.ReserveTripInClass(tripId, classId);
            return Ok();
        }

        [HttpGet("student/trip/{tripId}/classes")]
        public async Task<IActionResult> GetReservedClassesForTrip(int tripId)
        {
            var result = await _travelService.GetReservedClassesForTrip(tripId);
            return Ok(result);
        }

        [HttpPost("student/trip/{tripId}/choose-class/{classId}")]
        public async Task<IActionResult> ChooseClassForTrip(int tripId, int classId)
        {
            await _travelService.ChooseClassForTrip(tripId, classId);
            return Ok();
        }

        // ── Admin ─────────────────────────────────────────────────────────────

        [HttpGet("admin/bookings")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllBookingsAdmin(
            [FromQuery] DateOnly? from,
            [FromQuery] DateOnly? to)
        {
            var result = await _travelService.GetAllBookingsForAdmin(from, to);
            return Ok(result);
        }
    }

}
