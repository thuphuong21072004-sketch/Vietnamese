using Backend.dto;
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

        /// <summary>Admin: lịch sử các khoản đã trả giáo viên</summary>
        [HttpGet("admin/payouts")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> GetPayouts([FromQuery] int? teacherUserId)
        {
            return Ok(await _stats.GetPayouts(teacherUserId));
        }

        /// <summary>Admin: ghi nhận đã trả tiền cho giáo viên</summary>
        [HttpPost("admin/payouts")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePayout([FromBody] CreatePayoutDto dto)
        {
            return Ok(await _stats.CreatePayout(dto));
        }

        /// <summary>Admin: xoá khoản trả nhập nhầm</summary>
        [HttpDelete("admin/payouts/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePayout(int id)
        {
            await _stats.DeletePayout(id);
            return NoContent();
        }
    }
}
