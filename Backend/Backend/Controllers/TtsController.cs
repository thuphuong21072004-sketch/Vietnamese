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

        public TtsController(TextToSpeechService textToSpeech)
        {
            _textToSpeech = textToSpeech;
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