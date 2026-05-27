using System.Diagnostics;
using System.Text;

namespace Backend.Services.impl
{
    public sealed class GttsTextToSpeechService : TextToSpeechService
    {
        private const int MaxTextLength = 5_000;

        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GttsTextToSpeechService> _logger;

        public GttsTextToSpeechService(
            IWebHostEnvironment environment,
            IConfiguration configuration,
            ILogger<GttsTextToSpeechService> logger)
        {
            _environment = environment;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> GenerateAudioAsync(
            string? text,
            CancellationToken cancellationToken = default)
        {
            var normalizedText = text?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedText))
            {
                throw new ArgumentException("Nội dung đọc không được để trống.", nameof(text));
            }

            if (normalizedText.Length > MaxTextLength)
            {
                throw new ArgumentException(
                    $"Nội dung đọc không được vượt quá {MaxTextLength} ký tự.",
                    nameof(text));
            }

            var audioDirectory = Path.Combine(GetWebRootPath(), "audio");
            Directory.CreateDirectory(audioDirectory);

            var fileName = $"{Guid.NewGuid():N}.mp3";
            var outputPath = Path.Combine(audioDirectory, fileName);
            var scriptPath = Path.Combine(_environment.ContentRootPath, "Scripts", "tts.py");
            if (!File.Exists(scriptPath))
            {
                throw new InvalidOperationException("Không tìm thấy chương trình tạo giọng đọc.");
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = _configuration["TextToSpeech:PythonExecutable"] ?? "python",
                RedirectStandardInput = true,
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                StandardInputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8,
                StandardOutputEncoding = Encoding.UTF8,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            startInfo.Environment["PYTHONUTF8"] = "1";
            startInfo.ArgumentList.Add(scriptPath);
            startInfo.ArgumentList.Add(outputPath);

            using var process = new Process { StartInfo = startInfo };
            try
            {
                if (!process.Start())
                {
                    throw new InvalidOperationException("Không thể khởi chạy tiến trình tạo giọng đọc.");
                }
            }
            catch (Exception ex) when (ex is not InvalidOperationException)
            {
                throw new InvalidOperationException("Không thể khởi chạy Python để tạo giọng đọc.", ex);
            }

            await process.StandardInput.WriteAsync(normalizedText.AsMemory(), cancellationToken);
            process.StandardInput.Close();

            var outputTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
            var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);
            try
            {
                await process.WaitForExitAsync(cancellationToken);
            }
            catch (OperationCanceledException)
            {
                TryStopProcess(process);
                throw;
            }

            var output = await outputTask;
            var error = await errorTask;
            if (process.ExitCode != 0 || !File.Exists(outputPath))
            {
                _logger.LogError(
                    "gTTS failed with exit code {ExitCode}. Output: {Output}. Error: {Error}",
                    process.ExitCode,
                    output,
                    error);
                throw new InvalidOperationException("Không thể tạo tệp âm thanh.");
            }

            return $"/audio/{fileName}";
        }

        private string GetWebRootPath()
        {
            return _environment.WebRootPath
                ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        }

        private static void TryStopProcess(Process process)
        {
            try
            {
                if (!process.HasExited)
                {
                    process.Kill(entireProcessTree: true);
                }
            }
            catch (InvalidOperationException)
            {
            }
        }
    }
}