using Backend.dto;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [Route("api/tests")]
    public class TestController : Controller
    {
        private readonly TestService _testService;
        public TestController(TestService testService)
        {
            _testService = testService;
        }
        // User Quiz//
        /*
         * hiển thị bài kiểm tra quiz theo Unit, course, level, Placement
         * 
         * thuphuong21072004
         */
        [HttpGet("allQuiz")]
        public async Task<IActionResult> GetQuiz(int refId, string refType)
        {
            return Ok(await _testService.GetQuiz(refId, refType));
        }
        /*
         * save toàn bộ bài kiểm tra
         * 
         * thuphuong21072004
         */
        [Authorize]
        [HttpPost("quiz/full")]
        public async Task<IActionResult> AddFullQuiz([FromBody] QuizDTO dto)
        {
            await _testService.SaveQuiz(dto);
            return Ok("Add full quiz success");
        }
        /*
         * xóa quiz
         * 
         * thuphuong21072004
         */
        [Authorize]
        [HttpDelete("deleteQuiz")]
        public async Task<IActionResult> DeleteQuiz(int id)
        {
            await _testService.DeleteQuiz(id);
            return Ok("Delete success");
        }
        /*
         * nộp bài quiz và chấm điểm
         * 
         * thuphuong21072004
         */
        [Authorize]
        [HttpPost("submitQuiz")]
        public async Task<IActionResult> SubmitQuiz([FromBody] SubmitQuizDTO dto)
        {
            
            await _testService.SubmitQuiz(dto.QuizId, dto.AnswerIds);
            return Ok("Submit quiz success");
        }
        /*
         * lấy điểm bài kiểm tra 
         * 
         * thuphuong21072004
         */
        [Authorize]
        [HttpGet("my-quiz-result")]
        public async Task<IActionResult> GetMyQuizResult(int quizId)
        {
            return Ok(await _testService.GetMyQuizResult(quizId));
        }
        [HttpGet("review-raw/{quizId}")]
        public async Task<IActionResult> GetRaw(int quizId)
        {
            var data = await _testService.GetUserAnswerRaw(quizId);
            return Ok(data);
        }

        [HttpGet("listplacements")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _testService.GetPlacements());
        }

        [HttpPost("savePlacements")]
        public async Task<IActionResult> Add([FromBody] PlacementTestDTO dto)
        {
            var result = await _testService.SavePlacement(dto);
            return Ok(result);
        }

        [HttpDelete("deletePlacements/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _testService.DeletePlacement(id);
            return Ok("Deleted");
        }
    }
}
