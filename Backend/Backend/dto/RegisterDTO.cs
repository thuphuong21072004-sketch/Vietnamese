namespace Backend.dto
{
    public class RegisterDTO
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string Name { get; set; }
        public string? Country { get; set; }

        public string? Bio { get; set; }

        public string? AvatarUrl { get; set; }
    }
}
