using Backend.Common;
using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/teacher-profile")]
    public class TeacherProfileController : ControllerBase
    {
        private readonly TeacherProfileService
            _teacherProfileService;

        private readonly UserContextUtil
            _userContext;

        public TeacherProfileController(
            TeacherProfileService teacherProfileService,
            UserContextUtil userContext)
        {
            _teacherProfileService =
                teacherProfileService;

            _userContext =
                userContext;
        }

        /*
         * lấy hồ sơ giáo viên hiện tại
         * O(1)
         */
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult>
            GetMyProfile()
        {
            var result =
                await _teacherProfileService
                    .GetMyProfile();

            return Ok(result);
        }

        /*
         * tạo hồ sơ cộng tác viên
         * O(1)
         */
        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult>
            CreateProfile(
                [FromBody]
                TeacherProfileDTO dto)
        {
            await _teacherProfileService
                .CreateProfile(dto);

            return Ok(new
            {
                success = true,

                message =
                    "Teacher profile created successfully"
            });
        }

        /*
         * cập nhật hồ sơ cộng tác viên
         * O(1)
         */
        [Authorize]
        [HttpPut("update")]
        public async Task<IActionResult>
            UpdateProfile(
                [FromBody]
                TeacherProfileDTO dto)
        {
            await _teacherProfileService
                .UpdateProfile(dto);

            return Ok(new
            {
                success = true,

                message =
                    "Teacher profile updated successfully"
            });
        }

        /*
         * submit hồ sơ cho admin duyệt
         * O(1)
         */
        [Authorize]
        [HttpPut("submit")]
        public async Task<IActionResult>
            SubmitProfile()
        {
            await _teacherProfileService
                .SubmitProfile();

            return Ok(new
            {
                success = true,

                message =
                    "Teacher profile submitted successfully"
            });
        }

        /*
         * admin duyệt / từ chối hồ sơ
         * O(1)
         */
        [Authorize]
        [HttpPut("update/{id}/status")]
        public async Task<IActionResult>
            UpdateStatus(
                int id,
                [FromQuery] int status)
        {
            await _teacherProfileService
                .UpdateStatus(id, status);

            return Ok(new
            {
                success = true,

                message =
                    "Teacher profile status updated successfully"
            });
        }

        /*
         * danh sách giáo viên
         * O(n)
         */
        [Authorize]
        [HttpGet("admin")]
        public async Task<IActionResult>
            GetAllTeachers(
                [FromQuery] int? status)
        {
            return Ok(
                await _teacherProfileService
                    .GetAllTeachers(status)
            );
        }

        /*
         * chi tiết giáo viên
         * O(1)
         */
        [HttpGet("{id}")]
        public async Task<IActionResult>
            GetDetail(int id)
        {
            return Ok(
                await _teacherProfileService
                    .GetDetail(id)
            );
        }
        /*
 * khóa vĩnh viễn giáo viên
 * O(1)
 */
        [Authorize]
        [HttpPut("ban/{id}")]
        public async Task<IActionResult>
            BanTeacher(int id)
        {
            await _teacherProfileService
                .BanTeacher(id);

            return Ok(new
            {
                success = true,

                message =
                    "Teacher banned successfully"
            });
        }
    }
}