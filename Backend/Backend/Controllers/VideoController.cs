using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/videos")]
    public class VideoController : ControllerBase
    {
        private readonly VideoService _videoService;

        public VideoController(VideoService videoService)
        {
            _videoService = videoService;
        }

        [HttpGet("searchVideo")]
        public async Task<IActionResult> Search(string keyword, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _videoService.Search(keyword, page, pageSize);
            return Ok(result);
        }

        [Authorize]
        [HttpPost("insertVideo")]
        public async Task<IActionResult> ImportVideo([FromBody] VideoDTO request)
        {
            await _videoService.ImportVideo(request.YoutubeId);
            return Ok("Video imported successfully");
        }

        [HttpGet("listVideo")]
        public async Task<IActionResult> GetVideos([FromQuery] int? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var videos = await _videoService.GetAllVideos(status, page, pageSize);
            return Ok(videos);
        }

        [Authorize]
        [HttpPut("updateVideo")]
        public async Task<IActionResult> UpdateVideo([FromQuery] int videoId, [FromQuery] int status)
        {
            await _videoService.updateVideo(videoId, status);
            return Ok("Video updated successfully");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetVideo(string id)
        {
            var video = await _videoService.GetVideo(id);

            if (video == null)
            {
                return NotFound(new { message = "Không tìm thấy video" });
            }

            return Ok(video);
        }
    }
}