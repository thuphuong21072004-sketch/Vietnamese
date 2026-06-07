using AutoMapper;
using Backend.dto;
using Backend.DTO;
using Backend.Models;

namespace Backend.Mapper
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Video, VideoDTO>()
                .ReverseMap();

            CreateMap<Transcript, TranscriptDTO>()

                .ForMember(
                    dest => dest.YoutubeId,

                    opt => opt.MapFrom(src =>

                        src.Video != null
                            ? src.Video.YoutubeId
                            : null
                    ))

                .ReverseMap();

            CreateMap<Level, LevelDTO>()
                .ReverseMap();

            CreateMap<Course, CourseDTO>()
                .ReverseMap();

            CreateMap<Unit, UnitDTO>()
                .ReverseMap();

            CreateMap<Quiz, QuizDTO>()
                .ReverseMap();

            CreateMap<Part, PartDTO>()
                .ReverseMap();

            CreateMap<Passage, PassageDTO>()
                .ReverseMap();

            CreateMap<Question, QuestionDTO>()
                .ReverseMap();

            CreateMap<Answer, AnswerDTO>()
                .ReverseMap();

            CreateMap<UserQuiz, UserQuizDTO>()
                .ReverseMap();

            CreateMap<UserAnswer, UserAnswerDTO>()
                .ReverseMap();

            CreateMap<PlacementTest,
                PlacementTestDTO>()
                .ReverseMap();

            /*
             * user
             */
            CreateMap<User, UserDTO>()
    .ForMember(dest => dest.RoleName,
        opt => opt.MapFrom(src =>
            src.Role != null
                ? src.Role.RoleName
                : ""
        ))
    .ForMember(dest => dest.TeacherProfile,
        opt => opt.MapFrom(src =>
            src.TeacherProfile
        ));

            /*
             * teacher profile
             */
            CreateMap<TeacherProfile, TeacherProfileDTO>()
    .ForMember(dest => dest.TeacherName,
        opt => opt.MapFrom(src =>
            src.User != null
                ? src.User.Name
                : ""
        ))
    .ForMember(dest => dest.AvatarUrl,
        opt => opt.MapFrom(src =>
            src.User != null
                ? src.User.AvatarUrl
                : ""
        ))
    .ReverseMap();

            /*
             * teacher availability
             */
            CreateMap<
    TeacherAvailability,
    TeacherAvailabilityDTO>()

    .ForMember(
        dest => dest.Instructor,
        opt => opt.MapFrom(
            src => src.Instructor
        ))

    .ForMember(
        dest => dest.InstructorProfile,
        opt => opt.MapFrom(
            src => src.Instructor.TeacherProfile
        ));

            /*
             * booking
             */
            CreateMap<Booking,
    BookingDTO>()

    .ForMember(
        dest => dest.StudentName,

        opt => opt.MapFrom(src =>

            src.Student != null
                ? src.Student.Name
                : ""
        ))

    .ForMember(
        dest => dest.InstructorName,

        opt => opt.MapFrom(src =>

            src.Instructor != null
                ? src.Instructor.Name
                : ""
        ))

    .ReverseMap();

            /*
             * payment
             */
            CreateMap<Payment, PaymentDTO>()
                .ReverseMap();

            /*
             * video room
             */
            CreateMap<VideoRoom,
                VideoRoomDTO>()
                .ReverseMap();

            /*
             * review
             */
            CreateMap<
    Backend.Models.Review,
    ReviewDTO>()

    .ForMember(
        dest => dest.StudentName,
        opt => opt.MapFrom(src =>
            src.Student != null
                ? src.Student.Name
                : ""
        ))

    .ForMember(
        dest => dest.InstructorName,
        opt => opt.MapFrom(src =>
            src.Instructor != null
                ? src.Instructor.Name
                : ""
        ))

    .ReverseMap();



            CreateMap<TeacherClass, TeacherClassDto>()

    .ForMember(
        dest => dest.TeacherName,
        opt => opt.MapFrom(src =>
            src.TeacherProfile != null &&
            src.TeacherProfile.User != null
                ? src.TeacherProfile.User.Name
                : ""
        ))

    .ForMember(
        dest => dest.Country,
        opt => opt.MapFrom(src =>
            src.TeacherProfile != null &&
            src.TeacherProfile.User != null
                ? src.TeacherProfile.User.Country
                : ""
        ))

    .ForMember(
        dest => dest.RatingAverage,
        opt => opt.MapFrom(src =>
            src.TeacherProfile != null
                ? src.TeacherProfile.RatingAverage
                : 0
        ))

    .ForMember(
        dest => dest.AvatarUrl,
        opt => opt.MapFrom(src =>
            src.TeacherProfile != null &&
            src.TeacherProfile.User != null
                ? src.TeacherProfile.User.AvatarUrl
                : null
        ))

    .ForMember(
        dest => dest.TeacherProfile,
        opt => opt.MapFrom(src =>
            src.TeacherProfile
        ))

    .ForMember(
        dest => dest.Sessions,
        opt => opt.MapFrom(src =>
            src.ClassSessions
        ))

    .ForMember(
        dest => dest.ScheduleDays,
        opt => opt.MapFrom(src =>
            src.ClassScheduleDays
        ));
            CreateMap<TeacherClassDto, TeacherClass>()
    .ForMember(
        dest => dest.ClassSessions,
        opt => opt.Ignore()
    )
    .ForMember(
        dest => dest.ClassScheduleDays,
        opt => opt.Ignore()
    );

            CreateMap<ClassSession, ClassSessionDto>()
    .ReverseMap();

            CreateMap<ClassScheduleDay, ClassScheduleDayDto>()
                .ReverseMap();
            CreateMap<ClassEnrollment, ClassEnrollmentDto>()

    .ForMember(
        dest => dest.StudentName,
        opt => opt.MapFrom(src =>
            src.Student != null
                ? src.Student.Name
                : ""
        )
    )

    .ForMember(
        dest => dest.StudentAvatarUrl,
        opt => opt.MapFrom(src =>
            src.Student != null
                ? src.Student.AvatarUrl
                : ""
        )
    )

    .ForMember(
        dest => dest.StudentCountry,
        opt => opt.MapFrom(src =>
            src.Student != null
                ? src.Student.Country
                : ""
        )
    )

    .ForMember(
        dest => dest.TeacherName,
        opt => opt.MapFrom(src =>
            src.TeacherClass != null
            && src.TeacherClass.TeacherProfile != null
            && src.TeacherClass.TeacherProfile.User != null
                ? src.TeacherClass.TeacherProfile.User.Name
                : ""
        )
    )

    .ForMember(
        dest => dest.TeacherAvatarUrl,
        opt => opt.MapFrom(src =>
            src.TeacherClass != null
            && src.TeacherClass.TeacherProfile != null
            && src.TeacherClass.TeacherProfile.User != null
                ? src.TeacherClass.TeacherProfile.User.AvatarUrl
                : ""
        )
    )

    .ForMember(
        dest => dest.TeacherCountry,
        opt => opt.MapFrom(src =>
            src.TeacherClass != null
            && src.TeacherClass.TeacherProfile != null
            && src.TeacherClass.TeacherProfile.User != null
                ? src.TeacherClass.TeacherProfile.User.Country
                : ""
        )
    )

    .ForMember(
        dest => dest.ClassTitle,
        opt => opt.MapFrom(src =>
            src.TeacherClass != null
                ? src.TeacherClass.Title
                : ""
        )
    )
    .ForMember(
    dest => dest.Price,
    opt => opt.MapFrom(src =>
        src.TeacherClass != null
            ? src.TeacherClass.Price
            : 0
    )
)

.ForMember(
    dest => dest.TotalSessions,
    opt => opt.MapFrom(src =>
        src.TeacherClass != null
            ? src.TeacherClass.TotalSessions
            : 0
    )
)

.ForMember(
    dest => dest.CurrentStudents,
    opt => opt.MapFrom(src =>
        src.TeacherClass != null
            ? src.TeacherClass.CurrentStudents
            : 0
    )
)

.ForMember(
    dest => dest.MaxStudents,
    opt => opt.MapFrom(src =>
        src.TeacherClass != null
            ? src.TeacherClass.MaxStudents
            : 0
    )
)
.ForMember(
    dest => dest.Description,
    opt => opt.MapFrom(src =>
        src.TeacherClass != null
            ? src.TeacherClass.Description
            : ""
    )
)

.ForMember(
    dest => dest.MainTopic,
    opt => opt.MapFrom(src =>
        src.TeacherClass != null
            ? src.TeacherClass.MainTopic
            : ""
    )
)

.ForMember(
    dest => dest.SubTopic,
    opt => opt.MapFrom(src =>
        src.TeacherClass != null
            ? src.TeacherClass.SubTopic
            : ""
    )
)

.ForMember(
    dest => dest.StartTime,
    opt => opt.MapFrom(src =>
        src.TeacherClass != null
            ? src.TeacherClass.StartTime
            : TimeSpan.Zero
    )
)

.ForMember(
    dest => dest.EndTime,
    opt => opt.MapFrom(src =>
        src.TeacherClass != null
            ? src.TeacherClass.EndTime
            : TimeSpan.Zero
    )
)

.ForMember(
    dest => dest.ScheduleDays,
    opt => opt.MapFrom(src =>
        src.TeacherClass != null
            ? src.TeacherClass.ClassScheduleDays
                .Select(d => d.DayOfWeek)
                .ToList()
            : new List<string>()
    )
)

    .ReverseMap();
        }
    }
}