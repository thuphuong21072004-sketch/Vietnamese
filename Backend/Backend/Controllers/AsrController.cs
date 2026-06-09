using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/asr")]
    public sealed class AsrController : ControllerBase
    {
        private readonly SpeechToTextService _speechToText;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<AsrController> _logger;

        public AsrController(
            SpeechToTextService speechToText,
            IWebHostEnvironment environment,
            ILogger<AsrController> logger)
        {
            _speechToText = speechToText;
            _environment = environment;
            _logger = logger;
        }

        [HttpPost]
        [RequestSizeLimit(20 * 1024 * 1024)]
        public async Task<ActionResult<SpeechToTextResponseDto>> Transcribe(
            IFormFile audio,
            CancellationToken cancellationToken)
        {
            if (audio == null || audio.Length == 0)
                return BadRequest(new { message = "Tệp âm thanh không được để trống." });

            var webRoot = _environment.WebRootPath
                ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var audioDir = Path.Combine(webRoot, "audio");
            Directory.CreateDirectory(audioDir);

            var ext = Path.GetExtension(audio.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(ext)) ext = ".webm";
            var fileName = $"{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(audioDir, fileName);
            var audioUrl = $"/audio/{fileName}";

            // Save audio file — always keep it so frontend can play back
            await using (var fs = System.IO.File.Create(filePath))
                await audio.CopyToAsync(fs, cancellationToken);

            // Transcribe — failure returns empty text but keeps the audio
            var text = string.Empty;
            try
            {
                text = await _speechToText.TranscribeAsync(filePath, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Transcription failed for {File}: {Message}", fileName, ex.Message);
            }

            return Ok(new SpeechToTextResponseDto { Text = text, AudioUrl = audioUrl });
        }
    }
}
