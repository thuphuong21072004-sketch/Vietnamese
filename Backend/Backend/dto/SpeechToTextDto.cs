namespace Backend.dto
{
    public sealed class SpeechToTextResponseDto
    {
        public string Text { get; set; } = string.Empty;
        public string AudioUrl { get; set; } = string.Empty;
    }
}
