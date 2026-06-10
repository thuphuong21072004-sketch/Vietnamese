namespace Backend.dto
{
    public sealed class PronunciationGradeDto
    {
        public string Transcript { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public List<WordResultDto> Words { get; set; } = new();
        public List<string> ExtraWords { get; set; } = new();
        public List<PronunciationErrorDto> Errors { get; set; } = new();
    }

    public sealed class WordResultDto
    {
        public string Word { get; set; } = string.Empty;
        /// <summary>correct | accent | character | wrong | missing</summary>
        public string Status { get; set; } = string.Empty;
        public string? Actual { get; set; }
        public int? Score { get; set; }
    }

    public sealed class PronunciationErrorDto
    {
        public string Type { get; set; } = string.Empty;
        public string? Expected { get; set; }
        public string? Actual { get; set; }
        public int? Score { get; set; }
    }
}
