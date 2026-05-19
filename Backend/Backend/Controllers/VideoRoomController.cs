using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/video-rooms")]
    public class VideoRoomController
        : ControllerBase
    {
        private readonly VideoRoomService
            _videoRoomService;

        public VideoRoomController(
            VideoRoomService videoRoomService
        )
        {
            _videoRoomService =
                videoRoomService;
        }

        /*
         * tạo room video call
         */
        [Authorize]
        [HttpPost("{bookingId}")]
        public async Task<IActionResult> Create(int bookingId)
        {
            return Ok(
                await _videoRoomService
                    .Create(bookingId)
            );
        }

        /*
         * lấy room theo booking
         */
        [Authorize]
        [HttpGet("{bookingId}")]
        public async Task<IActionResult>  GetByBookingId(int bookingId)
        {
            return Ok(
                await _videoRoomService
                    .GetByBookingId(
                        bookingId
                    )
            );
        }
    }
}