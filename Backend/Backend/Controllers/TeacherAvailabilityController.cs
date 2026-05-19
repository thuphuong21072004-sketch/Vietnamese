using Backend.Common;
using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/teacher-availability")]
    public class TeacherAvailabilityController : ControllerBase
    {
        private readonly TeacherAvailabilityService _availabilityService;

        public TeacherAvailabilityController(TeacherAvailabilityService availabilityService)
        {
            _availabilityService = availabilityService;
        }

        /* 
         * student xem tất cả lịch trống
         * O(n)
         * (thuphuong21072004) 
         */
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableSchedules([FromQuery] DateOnly? date)
        {
            return Ok(await _availabilityService.GetAvailableSchedules(date));
        }

        /* 
         * xem chi tiết lịch
         * O(1)
         * (thuphuong21072004) 
         */
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            return Ok(await _availabilityService.GetDetail(id));
        }

        /* 
         * teacher xem lịch của mình
         * O(n)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMySchedules()
        {
            return Ok(await _availabilityService.GetMySchedules());
        }

        /* 
         * teacher tạo lịch
         * O(1)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TeacherAvailabilityDTO dto)
        {
            await _availabilityService.Create(dto);

            return Ok(new
            {
                success = true,
                message = "Schedule created successfully"
            });
        }

        /* 
         * teacher sửa lịch
         * O(1)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TeacherAvailabilityDTO dto)
        {
            await _availabilityService.Update(id, dto);

            return Ok(new
            {
                success = true,
                message = "Schedule updated successfully"
            });
        }

        /* 
         * teacher xoá lịch
         * O(1)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _availabilityService.Delete(id);

            return Ok(new
            {
                success = true,
                message = "Schedule deleted successfully"
            });
        }
    }
}