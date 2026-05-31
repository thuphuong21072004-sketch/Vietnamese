using Backend.Common;
using Backend.Repository;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/bookings")]
    public class BookingController : ControllerBase
    {
        private readonly BookingService _bookingService;
        private readonly UserContextUtil _userContext;

        public BookingController(BookingService bookingService, UserContextUtil userContext)
        {
            _bookingService = bookingService;
            _userContext = userContext;
        }

        [Authorize]
        [HttpPost("{availabilityId}")]
        public async Task<IActionResult> Create(int availabilityId)
        {
            var booking = await _bookingService.Create(availabilityId);
            return Ok(booking);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyBookings([FromQuery] byte? status, [FromQuery] DateOnly? date)
        {
            return Ok(await _bookingService.GetMyBookings(status, date));
        }

        [Authorize]
        [HttpGet("teacher")]
        public async Task<IActionResult> GetTeacherBookings([FromQuery] byte? status, [FromQuery] DateOnly? date)
        {
            return Ok(await _bookingService.GetTeacherBookings(status, date));
        }

        [Authorize]
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            await _bookingService.Cancel(id);
            return Ok(new { success = true, message = "Booking cancelled successfully" });
        }

        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            return Ok(await _bookingService.GetDetail(id));
        }

        [Authorize]
        [HttpGet("me/statistics")]
        public async Task<IActionResult> GetMyStatistics([FromQuery] int month, [FromQuery] int year)
        {
            return Ok(await _bookingService.GetMyStatistics(month, year));
        }

        [Authorize]
        [HttpGet("teacher/statistics")]
        public async Task<IActionResult> GetTeacherStatistics([FromQuery] int month, [FromQuery] int year)
        {
            return Ok(await _bookingService.GetTeacherStatistics(month, year));
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/top-teachers")]
        public async Task<IActionResult> GetTopTeachers([FromQuery] int month, [FromQuery] int year)
        {
            return Ok(await _bookingService.GetTopTeachers(month, year));
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/top-students")]
        public async Task<IActionResult> GetTopStudents([FromQuery] int month, [FromQuery] int year)
        {
            return Ok(await _bookingService.GetTopStudents(month, year));
        }
    }
}