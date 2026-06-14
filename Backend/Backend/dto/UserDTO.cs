using Backend.DTO;

namespace Backend.dto
{
    public class UserDTO
    {
        public string? Email { get; set; }

        public string? RoleName { get; set; }

        public int? Status { get; set; }

        public string? Name { get; set; }

        public string? Country { get; set; }

        public string? Bio { get; set; }

        public string? AvatarUrl { get; set; }

        public DateOnly? DateOfBirth { get; set; }

        public string? Gender { get; set; }

        public TeacherProfileDTO?
            TeacherProfile
        {
            get;
            set;
        }
    }
}