namespace Backend.Services
{
    public interface TextToSpeechService
    {
        Task<string> GenerateAudioAsync(
            string? text,
            CancellationToken cancellationToken = default);
    }
}