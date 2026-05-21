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

        /* 
         * student đặt lịch
         * O(1)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpPost("{availabilityId}")]
        public async Task<IActionResult> Create(int availabilityId)
        {
            var booking = await _bookingService.Create(availabilityId);

            return Ok(booking);
        }

        /* 
         * booking của student
         * O(n)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyBookings()
        {
            return Ok(await _bookingService.GetMyBookings());
        }

        /* 
         * booking của teacher
         * O(n)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpGet("teacher")]
        public async Task<IActionResult> GetTeacherBookings()
        {
            return Ok(await _bookingService.GetTeacherBookings());
        }

        /* 
         * huỷ lịch
         * O(1)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            await _bookingService.Cancel(id);

            return Ok(new
            {
                success = true,
                message = "Booking cancelled successfully"
            });
        }

        /* 
         * chi tiết booking
         * O(1)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            return Ok(await _bookingService.GetDetail(id));
        }
    }
}