using Backend.Common;
using Backend.dto;
using Backend.DTO;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/teacher-profile")]
    public class TeacherProfileController : ControllerBase
    {
        private readonly TeacherProfileService _teacherProfileService;
        private readonly UserContextUtil _userContext;

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
         */
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var result =
                await _teacherProfileService
                    .GetMyProfile();

            return Ok(result);
        }

        /*
         * tạo hồ sơ giáo viên
         */
        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> CreateProfile(
            [FromBody] TeacherProfileDTO dto)
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
         * cập nhật hồ sơ giáo viên
         */
        [Authorize]
        [HttpPut("update")]
        public async Task<IActionResult> UpdateProfile(
            [FromBody] TeacherProfileDTO dto)
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
         * nộp hồ sơ
         */
        [Authorize]
        [HttpPut("submit")]
        public async Task<IActionResult> SubmitProfile()
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
         * admin duyệt hồ sơ
         */
        [Authorize]
        [HttpPut("admin/{id}/approve")]
        public async Task<IActionResult> ApprovedAdmin(
            int id,
            [FromQuery] decimal approvedPrice,
            [FromQuery] string? note)
        {
            await _teacherProfileService
                .ApprovedAdmin(
                    id,
                    approvedPrice,
                    note);

            return Ok(new
            {
                success = true,
                message =
                    "Teacher profile approved successfully"
            });
        }

        /*
         * admin từ chối hồ sơ
         */
        [Authorize]
        [HttpPut("admin/{id}/reject")]
        public async Task<IActionResult> RejectedAdmin(
            int id,
            [FromQuery] string note)
        {
            await _teacherProfileService
                .RejectedAdmin(
                    id,
                    note);

            return Ok(new
            {
                success = true,
                message =
                    "Teacher profile rejected successfully"
            });
        }

        /*
         * giáo viên chấp nhận
         */
        [Authorize]
        [HttpPut("accept")]
        public async Task<IActionResult> ApprovedTeacher()
        {
            await _teacherProfileService
                .ApprovedTeacher();

            return Ok(new
            {
                success = true,
                message =
                    "Teacher accepted successfully"
            });
        }

        /*
         * giáo viên từ chối
         */
        [Authorize]
        [HttpPut("reject")]
        public async Task<IActionResult> RejectedTeacher()
        {
            await _teacherProfileService
                .RejectedTeacher();

            return Ok(new
            {
                success = true,
                message =
                    "Teacher rejected successfully"
            });
        }

        /*
         * danh sách giáo viên cho admin
         */
        [Authorize]
        [HttpGet("admin")]
        public async Task<IActionResult> GetAllTeachers(
            [FromQuery] int? status)
        {
            var result =
                await _teacherProfileService
                    .GetAllTeachers(status);

            return Ok(result);
        }

        /*
         * admin xem chi tiết hồ sơ
         */
        [Authorize]
        [HttpGet("admin/{id}")]
        public async Task<IActionResult>
            GetDetailForAdmin(int id)
        {
            var result =
                await _teacherProfileService
                    .GetDetailForAdmin(id);

            return Ok(result);
        }

        /*
         * học viên xem chi tiết giáo viên
         */
        [HttpGet("student/{id}")]
        public async Task<IActionResult>
            GetDetailForStudent(int id)
        {
            var result =
                await _teacherProfileService
                    .GetDetailForStudent(id);

            return Ok(result);
        }

        /*
         * khóa giáo viên
         */
        [Authorize]
        [HttpPut("ban/{id}")]
        public async Task<IActionResult>
            BanTeacher(
                int id,
                [FromQuery] string reason)
        {
            await _teacherProfileService
                .BanTeacher(
                    id,
                    reason);

            return Ok(new
            {
                success = true,
                message =
                    "Teacher banned successfully"
            });
        }

        /*
         * upload video giới thiệu
         */
        [Authorize]
        [HttpPost("upload-video")]
        public async Task<IActionResult>
            UploadVideo(IFormFile file)
        {
            if (
                file == null
                || file.Length == 0)
            {
                return BadRequest(
                    "Invalid file");
            }

            var extension =
                Path.GetExtension(
                    file.FileName);

            var fileName =
                $"{Guid.NewGuid()}{extension}";

            var uploadFolder =
                Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "videos");

            if (!Directory.Exists(
                uploadFolder))
            {
                Directory.CreateDirectory(
                    uploadFolder);
            }

            var filePath =
                Path.Combine(
                    uploadFolder,
                    fileName);

            using (
                var stream =
                new FileStream(
                    filePath,
                    FileMode.Create))
            {
                await file.CopyToAsync(
                    stream);
            }

            return Ok(new
            {
                videoUrl = fileName
            });
        }

        /*
 * upload chứng chỉ tiếng Anh
 */
        [Authorize]
        [HttpPost("upload-certificate")]
        public async Task<IActionResult>
            UploadCertificate(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Invalid file");
            }

            var extension =
                Path.GetExtension(file.FileName)
                    .ToLower();

            var allowedExtensions = new[]
            {
        ".pdf",
        ".doc",
        ".docx",
        ".jpg",
        ".jpeg",
        ".png"
    };

            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(
                    "Only PDF, DOC, DOCX, JPG, JPEG and PNG files are allowed");
            }

            var fileName =
                $"{Guid.NewGuid()}{extension}";

            var uploadFolder =
                Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "certificates");

            if (!Directory.Exists(uploadFolder))
            {
                Directory.CreateDirectory(
                    uploadFolder);
            }

            var filePath =
                Path.Combine(
                    uploadFolder,
                    fileName);

            using (
                var stream =
                new FileStream(
                    filePath,
                    FileMode.Create))
            {
                await file.CopyToAsync(
                    stream);
            }

            return Ok(new
            {
                fileUrl = fileName
            });
        }
    }
}