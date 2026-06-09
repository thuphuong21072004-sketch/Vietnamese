using System.Diagnostics;
using System.Net.Http.Headers;

namespace Backend.Services.impl
{
    public sealed class Wav2VecSpeechToTextService : SpeechToTextService, IDisposable
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly ILogger<Wav2VecSpeechToTextService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        private static Process? _serverProcess;
        private static bool _serverReady = false;
        private static readonly SemaphoreSlim _startLock = new(1, 1);

        public Wav2VecSpeechToTextService(
            IWebHostEnvironment environment,
            IConfiguration configuration,
            ILogger<Wav2VecSpeechToTextService> logger,
            IHttpClientFactory httpClientFactory)
        {
            _environment = environment;
            _configuration = configuration;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<string> TranscribeAsync(
            string audioFilePath,
            CancellationToken cancellationToken = default)
        {
            if (!File.Exists(audioFilePath))
                throw new InvalidOperationException("Không tìm thấy tệp âm thanh.");

            var port = _configuration.GetValue<int>("SpeechToText:ServerPort", 5200);
            await EnsureServerRunningAsync(port, cancellationToken);

            var client = _httpClientFactory.CreateClient("asr");
            using var form = new MultipartFormDataContent();
            await using var fs = File.OpenRead(audioFilePath);
            var fileContent = new StreamContent(fs);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("audio/wav");
            form.Add(fileContent, "audio", Path.GetFileName(audioFilePath));

            var response = await client.PostAsync(
                $"http://127.0.0.1:{port}/transcribe", form, cancellationToken);

            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException("Không thể nhận dạng giọng nói.");

            var json = await response.Content.ReadFromJsonAsync<AsrResult>(cancellationToken: cancellationToken);
            if (!string.IsNullOrEmpty(json?.Error))
                throw new InvalidOperationException(json.Error);

            return json?.Text ?? string.Empty;
        }

        private async Task EnsureServerRunningAsync(int port, CancellationToken ct)
        {
            if (_serverReady) return;

            await _startLock.WaitAsync(ct);
            try
            {
                if (_serverReady) return;

                // Check if already listening
                if (await IsServerHealthyAsync(port)) { _serverReady = true; return; }

                StartServerProcess(port);

                // Wait up to 60 seconds for model to load
                var deadline = DateTime.UtcNow.AddSeconds(60);
                while (DateTime.UtcNow < deadline)
                {
                    await Task.Delay(1000, ct);
                    if (await IsServerHealthyAsync(port)) { _serverReady = true; return; }
                }

                throw new InvalidOperationException("ASR server không khởi động được trong thời gian cho phép.");
            }
            finally
            {
                _startLock.Release();
            }
        }

        private void StartServerProcess(int port)
        {
            var python = _configuration["SpeechToText:PythonExecutable"]
                ?? _configuration["TextToSpeech:PythonExecutable"]
                ?? "python";
            var scriptPath = Path.Combine(_environment.ContentRootPath, "Scripts", "asr_server.py");
            var modelName = _configuration["SpeechToText:ModelName"]
                ?? "nguyenvulebinh/wav2vec2-base-vietnamese-250h";

            var info = new ProcessStartInfo
            {
                FileName = python,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            };
            info.ArgumentList.Add(scriptPath);
            info.ArgumentList.Add(port.ToString());
            info.ArgumentList.Add(modelName);

            _serverProcess = new Process { StartInfo = info, EnableRaisingEvents = true };
            _serverProcess.OutputDataReceived += (_, e) => { if (e.Data != null) _logger.LogInformation("[ASR] {Line}", e.Data); };
            _serverProcess.ErrorDataReceived += (_, e) => { if (e.Data != null) _logger.LogWarning("[ASR] {Line}", e.Data); };
            _serverProcess.Exited += (_, _) => { _serverReady = false; _logger.LogWarning("[ASR] Server process exited."); };

            _serverProcess.Start();
            _serverProcess.BeginOutputReadLine();
            _serverProcess.BeginErrorReadLine();

            _logger.LogInformation("[ASR] Python server starting on port {Port}...", port);
        }

        private async Task<bool> IsServerHealthyAsync(int port)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("asr");
                var res = await client.GetAsync($"http://127.0.0.1:{port}/health");
                return res.IsSuccessStatusCode;
            }
            catch { return false; }
        }

        public void Dispose()
        {
            try { _serverProcess?.Kill(entireProcessTree: true); } catch { }
            _serverProcess?.Dispose();
        }

        private sealed class AsrResult
        {
            public string? Text { get; set; }
            public string? Error { get; set; }
        }
    }
}
