using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/video-rooms")]
    [Authorize]
    public class VideoRoomController : ControllerBase
    {
        private readonly VideoRoomService _videoRoomService;

        public VideoRoomController(
            VideoRoomService videoRoomService)
        {
            _videoRoomService = videoRoomService;
        }

        /*
         * tạo phòng học
         */
        [HttpPost("{bookingId}")]
        public async Task<IActionResult> Create(
            int bookingId)
        {
            var room =
                await _videoRoomService
                    .Create(bookingId);

            return Ok(room);
        }

        /*
         * tham gia phòng học
         */
        [HttpGet("join/{bookingId}")]
        public async Task<IActionResult> JoinRoom(
            int bookingId)
        {
            var joinUrl =
                await _videoRoomService
                    .JoinRoom(bookingId);

            return Ok(new
            {
                success = true,
                joinUrl
            });
        }
    }
}