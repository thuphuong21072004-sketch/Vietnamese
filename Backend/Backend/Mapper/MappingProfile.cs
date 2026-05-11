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
                        src.Video != null ? src.Video.YoutubeId : null))
                .ReverseMap();

            CreateMap<Level, LevelDTO>().ReverseMap();

            CreateMap<Course, CourseDTO>().ReverseMap();

            CreateMap<Unit, UnitDTO>().ReverseMap();

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
            CreateMap<PlacementTest, PlacementTestDTO>()
    .ReverseMap();
        }
    }
}