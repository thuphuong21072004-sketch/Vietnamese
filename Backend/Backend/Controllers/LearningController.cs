using Backend.Common;
using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [Route("api/learning")]
    [ApiController]
    public class LevelController : ControllerBase
    {
        private readonly LearningService _learningService;

        public LevelController(LearningService learningService)
        {
            _learningService = learningService;

        }

        // level
        /*
         * lấy danh sách level
         * 
         * thuphuong21072004
         */
        [HttpGet("listLevels")]
        public async Task<IActionResult> GetLevels()
        {
            return Ok(await _learningService.GetLevels());
        }
        /*
         * lấy thông tin level theo id
         * 
         * thuphuong21072004
         */
        [HttpGet("getLevelById")]
        public async Task<IActionResult> GetLevelById(int id)
        {
            var result = await _learningService.GetLevelById(id);

            if (result == null) return NotFound("Level not found");

            return Ok(result);
        }
        /*
         * lưu level mới
         * 
         * thuphuong21072004
         */
        [Authorize]
        [HttpPost("saveLevel")]
        public async Task<IActionResult> SaveLevel(List<LevelDTO> list)
        {
            await _learningService.SaveLevels(list);
            return Ok("Save success");
        }

        // course
        /*
         * lấy danh sách course theo level
         * 
         * thuphuong21072004
         */
        [HttpGet("listCourses")]
        public async Task<IActionResult> GetCourses(int levelId)
        {
            var result = await _learningService.GetCourses(levelId);
            return Ok(result);
        }
        /*
         * lấy thông tin course theo id
         * 
         * thuphuong21072004
         */
        [HttpGet("getCourseById")]
        public async Task<IActionResult> GetCourseById(int id)
        {
            var result = await _learningService.GetCourseById(id);

            if (result == null)
                return NotFound("Course not found");

            return Ok(result);
        }
        /*
         * lưu course mới
         * 
         * thuphuong21072004
         */
        [Authorize]
        [HttpPost("saveCourse")]
        public async Task<IActionResult> SaveCourse([FromBody] List<CourseDTO> list)
        {
            await _learningService.SaveCourses(list);
            return Ok("Save success");
        }

        //Unit
        /*
         * lấy danh sách Unit theo course
         * 
         * thuphuong21072004
         */
        [HttpGet("listUnits")]
        public async Task<IActionResult> GetUnits(int courseId)
        {
            var result = await _learningService.GetUnits(courseId);
            return Ok(result);
        }
        /*
         * lấy thông tin Unit theo id
         * 
         * thuphuong21072004
         */
        [HttpGet("getUnitById")]
        public async Task<IActionResult> GetUnitById(int id)
        {
            var result = await _learningService.GetUnitById(id);

            if (result == null) return NotFound("Unit not found");

            return Ok(result);
        }
        /*
         * lưu Unit mới
         * 
         * thuphuong21072004
         */
        [Authorize]
        [HttpPost("saveUnit")]
        public async Task<IActionResult> SaveUnit([FromBody] UnitDTO dto)
        {
            await _learningService.SaveUnit(dto);
            return Ok("Save success");
        }
        /*
         * xóa Unit
         * 
         * thuphuong21072004
         */
        [Authorize]
        [HttpDelete("deleteListUnit")]
        public async Task<IActionResult> DeleteListUnit([FromBody] List<int> ids)
        {
            await _learningService.DeleteUnits(ids);
            return Ok("Delete success");
        }
        /*
         * lưu video ,ảnh , audio
         * 
         * thuphuong21072004
         */
        [HttpPost("uploadMedia")]
        public async Task<IActionResult> UploadMedia(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file");

            var extension = Path.GetExtension(file.FileName).ToLower();

            string folder;

            if (extension == ".jpg" || extension == ".jpeg" || extension == ".png" || extension == ".webp")
            {
                folder = "images";
            }
            else if (extension == ".mp3" || extension == ".wav")
            {
                folder = "audios";
            }
            else if (extension == ".mp4" || extension == ".mov" || extension == ".avi")
            {
                folder = "videos";
            }
            else
            {
                return BadRequest("Unsupported file type");
            }

            var fileName = Guid.NewGuid().ToString() + extension;

            var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folder);

            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var filePath = Path.Combine(folderPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { fileName, folder });
        }
        /*
         * xóa video khi không lưu
         * 
         * thuphuong21072004
         */
        [HttpDelete("deleteVideo")]
        public IActionResult DeleteVideo(string fileName)
        {
            var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "videos", fileName);

            if (System.IO.File.Exists(path))
            {
                System.IO.File.Delete(path);
            }

            return Ok();
        }
        
        // user progress
        /*
         * lấy tiến độ học tập của user
         * 
         * thuphuong21072004
         */
        [Authorize]
        [HttpGet("my-progress")]
        public async Task<IActionResult> GetMyProgress()
        {
            return Ok(await _learningService.GetMyProgress());
        }
           
    }
}