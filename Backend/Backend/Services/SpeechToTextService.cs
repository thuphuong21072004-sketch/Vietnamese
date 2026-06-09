namespace Backend.Services
{
    public interface SpeechToTextService
    {
        Task<string> TranscribeAsync(
            string audioFilePath,
            CancellationToken cancellationToken = default);
    }
}
