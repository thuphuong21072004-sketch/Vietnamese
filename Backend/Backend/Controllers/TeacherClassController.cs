using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/teacher-classes")]
    public class TeacherClassController
        : ControllerBase
    {
        private readonly TeacherClassService
            _teacherClassService;

        public TeacherClassController(
            TeacherClassService teacherClassService)
        {
            _teacherClassService =
                teacherClassService;
        }

        /*
         * Generate schedule
         */
        [Authorize]
        [HttpPost("generate-schedule")]
        public async Task<IActionResult> GenerateSchedule(
    [FromBody] TeacherClassDto dto)
        {
            try
            {
                var result =
                   await  _teacherClassService
                        .GenerateSchedule(dto);

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        /*
         * Create class
         */
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateClass(
                [FromBody]
                TeacherClassDto dto)
        {
            try
            {
                var result =
                    await _teacherClassService
                        .CreateAsync(dto);

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
        [HttpPost("max-price")]
        public async Task<IActionResult> GetMaxPrice(
    [FromBody] TeacherClassDto dto)
        {
            var result =
                await _teacherClassService
                    .CalculateMaxPrice(dto);

            return Ok(result);
        }


        [HttpPost("my-classes")]
        public async Task<IActionResult> SearchMyClasses(
        [FromBody]
        ClassFilterDto filter)
        {
            var result =
                await _teacherClassService
                    .SearchMyClassesAsync(
                        filter);

            return Ok(result);
        }
        /*
         * tìm các lớp học
         */

        [HttpPost("search")]
        public async Task<IActionResult> SearchClasses(
        [FromBody]
        ClassFilterDto filter)
        {
            var result =
                await _teacherClassService
                    .SearchClassesAsync(
                        filter);

            return Ok(result);
        }
        /*
         * chi tiết lớp học
         */
        [Authorize]
        [HttpGet("{classId}")]
        public async Task<IActionResult> GetClassDetail(int classId)
        {
            var result =
                await _teacherClassService
                    .GetClassDetailAsync(
                        classId);

            return Ok(result);
        }
        /*
         * xóa lớp hoc
         */
        [Authorize]
        [HttpDelete("{classId}")]
        public async Task<IActionResult> DeleteClass( int classId)
        {
            try
            {
                await _teacherClassService
                    .DeleteClassAsync(
                        classId);

                return Ok(new
                {
                    success = true,
                    message = "Class deleted successfully"
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
         * sửa lớp học
         */
        [Authorize]
        [HttpPut("{classId}/sessions")]
        public async Task<IActionResult> UpdateSessions(
    int classId,
    [FromBody] List<ClassSessionDto> sessions)
        {
            try
            {
                await _teacherClassService
                    .UpdateSessionsAsync(
                        classId,
                        sessions);

                return Ok(new
                {
                    success = true,
                    message = "Sessions updated"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return BadRequest(new
                {
                    success = false,
                    message = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
    }
}