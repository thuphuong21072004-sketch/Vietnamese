using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text.Json;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/asr")]
    public sealed class AsrController : ControllerBase
    {
        private readonly SpeechToTextService _speechToText;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<AsrController> _logger;
        private readonly IConfiguration _configuration;

        public AsrController(
            SpeechToTextService speechToText,
            IWebHostEnvironment environment,
            ILogger<AsrController> logger,
            IConfiguration configuration)
        {
            _speechToText = speechToText;
            _environment = environment;
            _logger = logger;
            _configuration = configuration;
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

        /// <summary>
        /// Nhận audio + text gốc → chuyển audio sang text → chấm điểm phát âm
        /// </summary>
        [HttpPost("grade")]
        [RequestSizeLimit(20 * 1024 * 1024)]
        public async Task<ActionResult<PronunciationGradeDto>> Grade(
            IFormFile audio,
            [FromForm] string reference,
            CancellationToken cancellationToken)
        {
            if (audio == null || audio.Length == 0)
                return BadRequest(new { message = "Tệp âm thanh không được để trống." });
            if (string.IsNullOrWhiteSpace(reference))
                return BadRequest(new { message = "Text gốc không được để trống." });

            var webRoot = _environment.WebRootPath
                ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var audioDir = Path.Combine(webRoot, "audio");
            Directory.CreateDirectory(audioDir);

            var ext = Path.GetExtension(audio.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(ext)) ext = ".wav";
            var fileName = $"grade_{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(audioDir, fileName);

            try
            {
                await using (var fs = System.IO.File.Create(filePath))
                    await audio.CopyToAsync(fs, cancellationToken);

                // 1. Transcribe audio → text
                var transcript = string.Empty;
                try
                {
                    transcript = await _speechToText.TranscribeAsync(filePath, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Transcription failed: {Message}", ex.Message);
                }

                // 2. Score using tinhdiem.py
                var python = _configuration["TextToSpeech:PythonExecutable"] ?? "python";
                var scriptPath = Path.Combine(_environment.ContentRootPath, "Scripts", "tinhdiem.py");

                var psi = new ProcessStartInfo
                {
                    FileName = python,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    StandardOutputEncoding = System.Text.Encoding.UTF8,
                };
                psi.ArgumentList.Add(scriptPath);
                psi.ArgumentList.Add(reference.Trim());
                psi.ArgumentList.Add(string.IsNullOrWhiteSpace(transcript) ? "" : transcript.Trim());

                using var process = Process.Start(psi)!;
                var stdout = await process.StandardOutput.ReadToEndAsync(cancellationToken);
                await process.WaitForExitAsync(cancellationToken);

                ScoreResult? result = null;
                try
                {
                    result = JsonSerializer.Deserialize<ScoreResult>(stdout,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Failed to parse tinhdiem output: {Message}", ex.Message);
                }

                return Ok(new PronunciationGradeDto
                {
                    Transcript = transcript,
                    Score = result?.Score ?? 0,
                    Words = result?.Words?
                        .Select(w => new WordResultDto
                        {
                            Word = w.Word ?? string.Empty,
                            Status = w.Status ?? string.Empty,
                            Actual = w.Actual,
                            Score = w.Score
                        }).ToList() ?? new(),
                    ExtraWords = result?.ExtraWords ?? new(),
                    Errors = result?.Errors?
                        .Select(e => new PronunciationErrorDto
                        {
                            Type = e.Type ?? string.Empty,
                            Expected = e.Expected,
                            Actual = e.Actual,
                            Score = e.Score
                        }).ToList() ?? new()
                });
            }
            finally
            {
                if (System.IO.File.Exists(filePath))
                    try { System.IO.File.Delete(filePath); } catch { }
            }
        }

        /// <summary>
        /// So sánh 2 đoạn text bằng tinhdiem.py (dùng cho câu hỏi WRITING)
        /// </summary>
        [HttpPost("compare")]
        public async Task<ActionResult<PronunciationGradeDto>> CompareText(
            [FromForm] string text,
            [FromForm] string reference,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(text) || string.IsNullOrWhiteSpace(reference))
                return BadRequest(new { message = "text và reference không được để trống." });

            var python = _configuration["TextToSpeech:PythonExecutable"] ?? "python";
            var scriptPath = Path.Combine(_environment.ContentRootPath, "Scripts", "tinhdiem.py");

            var psi = new ProcessStartInfo
            {
                FileName = python,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                StandardOutputEncoding = System.Text.Encoding.UTF8,
            };
            psi.ArgumentList.Add(scriptPath);
            psi.ArgumentList.Add(reference.Trim());
            psi.ArgumentList.Add(text.Trim());

            using var process = Process.Start(psi)!;
            var stdout = await process.StandardOutput.ReadToEndAsync(cancellationToken);
            await process.WaitForExitAsync(cancellationToken);

            ScoreResult? result = null;
            try
            {
                result = JsonSerializer.Deserialize<ScoreResult>(stdout,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to parse tinhdiem output: {Message}", ex.Message);
            }

            return Ok(new PronunciationGradeDto
            {
                Transcript = text,
                Score = result?.Score ?? 0,
                Words = result?.Words?
                    .Select(w => new WordResultDto
                    {
                        Word = w.Word ?? string.Empty,
                        Status = w.Status ?? string.Empty,
                        Actual = w.Actual,
                        Score = w.Score
                    }).ToList() ?? new(),
                ExtraWords = result?.ExtraWords ?? new(),
                Errors = new()
            });
        }

        private sealed class ScoreResult
        {
            public decimal Score { get; set; }
            public List<ScoreWord>? Words { get; set; }
            public List<string>? ExtraWords { get; set; }
            public List<ScoreError>? Errors { get; set; }
        }

        private sealed class ScoreWord
        {
            public string? Word { get; set; }
            public string? Status { get; set; }
            public string? Actual { get; set; }
            public int? Score { get; set; }
        }

        private sealed class ScoreError
        {
            public string? Type { get; set; }
            public string? Expected { get; set; }
            public string? Actual { get; set; }
            public int? Score { get; set; }
        }
    }
}
