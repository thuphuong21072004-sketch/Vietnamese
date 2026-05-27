namespace Backend.dto
{
    public sealed class TextToSpeechRequestDto
    {
        public string? Text { get; set; }
    }

    public sealed class TextToSpeechResponseDto
    {
        public string AudioUrl { get; set; } = string.Empty;
    }
}