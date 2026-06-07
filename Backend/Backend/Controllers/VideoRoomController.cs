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
        [HttpPost("{refName}/{refId}")]
        public async Task<IActionResult> Create(
    string refName,
    int refId)
        {
            return Ok(
                await _videoRoomService.Create(
                    refName,
                    refId));
        }

        /*
         * tham gia phòng học
         */
        [HttpGet("join/{refName}/{refId}")]
        public async Task<IActionResult> JoinRoom(
    string refName,
    int refId)
        {
            var joinUrl =
                await _videoRoomService
                    .JoinRoom(
                        refName,
                        refId);

            return Ok(new
            {
                success = true,
                joinUrl
            });
        }
    }
}