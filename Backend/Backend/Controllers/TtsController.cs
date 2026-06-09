using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/tts")]
    public sealed class TtsController : ControllerBase
    {
        private readonly TextToSpeechService _textToSpeech;
        private readonly IWebHostEnvironment _environment;

        public TtsController(TextToSpeechService textToSpeech, IWebHostEnvironment environment)
        {
            _textToSpeech = textToSpeech;
            _environment = environment;
        }

        [HttpDelete]
        public IActionResult Delete([FromQuery] string file)
        {
            if (string.IsNullOrWhiteSpace(file))
                return BadRequest();

            var fileName = Path.GetFileName(file);
            if (string.IsNullOrEmpty(fileName) || fileName != file.TrimStart('/').Split('/').Last())
                return BadRequest();

            var webRoot = _environment.WebRootPath
                ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var path = Path.Combine(webRoot, "audio", fileName);

            if (System.IO.File.Exists(path))
                System.IO.File.Delete(path);

            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult<TextToSpeechResponseDto>> Synthesize(
            [FromBody] TextToSpeechRequestDto request,
            CancellationToken cancellationToken)
        {
            try
            {
                var audioUrl = await _textToSpeech.GenerateAudioAsync(
                    request.Text,
                    cancellationToken);
                return Ok(new TextToSpeechResponseDto { AudioUrl = audioUrl });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new { message = ex.Message });
            }
        }
    }
}