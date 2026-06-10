using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/stats")]
    [Authorize]
    public class StatsController : ControllerBase
    {
        private readonly StatsService _stats;

        public StatsController(StatsService stats)
        {
            _stats = stats;
        }

        /// <summary>Student: payment stats for the selected month (or all-time if no params)</summary>
        [HttpGet("student")]
        public async Task<IActionResult> StudentStats([FromQuery] int? year, [FromQuery] int? month)
        {
            var result = await _stats.GetStudentStats(year, month);
            return Ok(result);
        }

        /// <summary>Teacher: earnings stats</summary>
        [HttpGet("teacher")]
        public async Task<IActionResult> TeacherStats([FromQuery] int? year, [FromQuery] int? month)
        {
            var result = await _stats.GetTeacherStats(year, month);
            return Ok(result);
        }

        /// <summary>Admin: full platform stats including per-teacher and per-student breakdown</summary>
        [HttpGet("admin")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> AdminStats([FromQuery] int? year, [FromQuery] int? month)
        {
            var result = await _stats.GetAdminStats(year, month);
            return Ok(result);
        }
    }
}
