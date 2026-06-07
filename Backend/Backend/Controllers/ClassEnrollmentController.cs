using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/class-enrollments")]
    public class ClassEnrollmentController
        : ControllerBase
    {
        private readonly ClassEnrollmentService
            _classEnrollmentService;

        public ClassEnrollmentController(
            ClassEnrollmentService classEnrollmentService)
        {
            _classEnrollmentService =
                classEnrollmentService;
        }

        /*
         * Student đăng ký lớp học
         */
        [Authorize]
        [HttpPost("{classId}")]
        public async Task<IActionResult> Enroll(int classId)
        {
            try
            {
                var enrollmentId =
                    await _classEnrollmentService
                        .EnrollAsync(classId);

                return Ok(new
                {
                    success = true,
                    enrollmentId
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        /*
         * Student hủy đăng ký
         */
        [Authorize]
        [HttpPut("{enrollmentId}/cancel")]
        public async Task<IActionResult> Cancel(int enrollmentId)
        {
            try
            {
                await _classEnrollmentService
                    .CancelAsync(enrollmentId);

                return Ok(new
                {
                    success = true,
                    message = "Enrollment cancelled"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        /*
         * Danh sách lớp học của học viên
         */
        [Authorize]
        [HttpGet("my-classes")]
        public async Task<IActionResult> GetMyClasses()
        {
            try
            {
                var result =
                    await _classEnrollmentService
                        .GetMyClassesAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        /*
         * Danh sách học viên của lớp
         */
        [Authorize]
        [HttpGet("class/{classId}/students")]
        public async Task<IActionResult> GetClassStudents(int classId)
        {
            try
            {
                var result =
                    await _classEnrollmentService
                        .GetClassStudentsAsync(
                            classId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [Authorize]
        [HttpGet("student/upcoming-schedule")]
        public async Task<IActionResult> StudentUpcomingSchedule()
        {
            var result =
                await _classEnrollmentService
                    .GetStudentUpcomingScheduleAsync();

            return Ok(result);
        }

        [Authorize]
        [HttpGet("teacher/upcoming-schedule")]
        public async Task<IActionResult> TeacherUpcomingSchedule()
        {
            var result =
                await _classEnrollmentService
                    .GetTeacherUpcomingScheduleAsync();

            return Ok(result);
        }

        [Authorize]
        [HttpGet("{enrollmentId}")]
        public async Task<IActionResult> GetDetail( int enrollmentId)
        {
            try
            {
                var result =
                    await _classEnrollmentService
                        .GetDetailAsync(
                            enrollmentId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }
}