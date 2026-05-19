using AutoMapper;
using Backend.Models;
using Backend.dto;

namespace Backend.Mapper
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Video, VideoDTO>().ReverseMap();

            CreateMap<Transcript, TranscriptDTO>()
                .ForMember(dest => dest.YoutubeId,
                    opt => opt.MapFrom(src =>
                        src.Video != null
                            ? src.Video.YoutubeId
                            : null
                    ))
                .ReverseMap();

            CreateMap<Level, LevelDTO>().ReverseMap();

            CreateMap<Course, CourseDTO>().ReverseMap();

            CreateMap<Unit, UnitDTO>().ReverseMap();

            CreateMap<Quiz, QuizDTO>().ReverseMap();

            CreateMap<Part, PartDTO>().ReverseMap();

            CreateMap<Passage, PassageDTO>().ReverseMap();

            CreateMap<Question, QuestionDTO>().ReverseMap();

            CreateMap<Answer, AnswerDTO>().ReverseMap();

            CreateMap<UserQuiz, UserQuizDTO>().ReverseMap();

            CreateMap<UserAnswer, UserAnswerDTO>().ReverseMap();

            CreateMap<PlacementTest, PlacementTestDTO>().ReverseMap();

            CreateMap<User, UserDTO>()
                .ForMember(dest => dest.RoleName,
                    opt => opt.MapFrom(src =>
                        src.Role != null
                            ? src.Role.RoleName
                            : ""
                    ));

            CreateMap<TeacherProfile, TeacherProfileDTO>()
                .ForMember(dest => dest.User,
                    opt => opt.MapFrom(src =>
                        src.User
                    ))
                .ReverseMap();

            CreateMap<TeacherAvailability, TeacherAvailabilityDTO>()
                .ForMember(dest => dest.TeacherProfile,
                    opt => opt.MapFrom(src =>
                        src.Teacher != null
                            ? src.Teacher.TeacherProfile
                            : null
                    ))
                .ReverseMap();

            CreateMap<Booking, BookingDTO>()
                .ForMember(dest => dest.StudentName,
                    opt => opt.MapFrom(src =>
                        src.Student != null
                            ? src.Student.Name
                            : ""
                    ))
                .ForMember(dest => dest.TeacherName,
                    opt => opt.MapFrom(src =>
                        src.Teacher != null
                            ? src.Teacher.Name
                            : ""
                    ))
                .ReverseMap();

            CreateMap<Payment, PaymentDTO>().ReverseMap();

            CreateMap<VideoRoom, VideoRoomDTO>().ReverseMap();

            CreateMap<Review, ReviewDTO>()
                .ForMember(dest => dest.StudentName,
                    opt => opt.MapFrom(src =>
                        src.Student != null
                            ? src.Student.Name
                            : ""
                    ))
                .ForMember(dest => dest.TeacherName,
                    opt => opt.MapFrom(src =>
                        src.Teacher != null
                            ? src.Teacher.Name
                            : ""
                    ))
                .ReverseMap();
        }
    }
}