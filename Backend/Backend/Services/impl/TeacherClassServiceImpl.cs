using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;
using static Backend.common.Constant;

namespace Backend.Services.impl
{
    public class TeacherClassServiceImpl
        : TeacherClassService
    {
        private readonly IMapper _mapper;

        private readonly TeacherClassRepository
            _teacherClassRepository;

        private readonly ClassScheduleDayRepository
            _classScheduleDayRepository;

        private readonly ClassSessionRepository
            _classSessionRepository;
        private readonly UserContextUtil _userContext;

        private readonly UserRepository _userRepository;

        private readonly TeacherProfileRepository
            _teacherProfileRepository;

        public TeacherClassServiceImpl(
            IMapper mapper,
            TeacherClassRepository
                teacherClassRepository,
            ClassScheduleDayRepository
                classScheduleDayRepository,
            ClassSessionRepository
                classSessionRepository,
            UserContextUtil userContext,
    UserRepository userRepository,
    TeacherProfileRepository teacherProfileRepository
            )
        {
            _mapper = mapper;

            _teacherClassRepository =
                teacherClassRepository;

            _classScheduleDayRepository =
                classScheduleDayRepository;

            _classSessionRepository =
                classSessionRepository;
            _userContext = userContext;
            _userRepository = userRepository;
            _teacherProfileRepository = teacherProfileRepository;
        }
        public async Task<decimal> CalculateMaxPrice(
        TeacherClassDto dto)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            var teacherProfile =
                await _teacherProfileRepository
                    .GetByUserId(userId);

            if (teacherProfile == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }

            return await
                _teacherClassRepository
                    .CalculateMaxPrice(
                        teacherProfile
                            .TeacherProfileId,
                        dto.MaxStudents,
                        dto.TotalSessions,
                        dto.StartTime,
                        dto.EndTime);
        }
        public async Task<List<ClassSessionDto>> GenerateSchedule( TeacherClassDto dto)
        {
            if (dto == null)
            {
                throw new Exception("TeacherClassDto is null");
            }

            if (dto.StartDate == default)
            {
                throw new Exception("Please select start date");
            }

            if (dto.ScheduleDays == null ||
                !dto.ScheduleDays.Any())
            {
                throw new Exception(
                    "Please select at least one study day");
            }

            if (dto.TotalSessions <= 0)
            {
                throw new Exception(
                    "Total sessions must be greater than 0");
            }

            if (dto.EndTime <= dto.StartTime)
            {
                throw new Exception(
                    "End time must be greater than start time");
            }
            var duration = dto.EndTime - dto.StartTime;

            if (duration.TotalHours > 3)
            {
                throw new Exception(
                    "Each class session cannot exceed 3 hours");
            }
            if (dto.MaxStudents<=0 || dto.MaxStudents>10)
            {
                throw new Exception(
                    "Maximum students must be between 1 and 10");
            }
            var maxPrice = await CalculateMaxPrice(dto);

            if (dto.Price > maxPrice)
            {
                throw new Exception(
                    $"Course price cannot exceed {maxPrice:F2}$");
            }

            var email =
    _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            var teacherProfile =
                await _teacherProfileRepository
                    .GetByUserId(userId);

            if (teacherProfile == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }

            var existingClasses =
                await _teacherClassRepository
                    .GetByTeacherProfileIdAsync(
                        teacherProfile
                            .TeacherProfileId);

            double newHours =
                (
                    dto.EndTime -
                    dto.StartTime
                ).TotalHours;
            if (newHours > 10)
            {
                throw new Exception(
                    "A class cannot exceed 10 teaching hours");
            }

            foreach (var day in dto.ScheduleDays)
            {
                double totalHours =
                    newHours;

                foreach (var oldClass
                    in existingClasses)
                {
                    bool sameDay =
                        oldClass.ClassScheduleDays
                            .Any(x =>
                                x.DayOfWeek ==
                                day.DayOfWeek);

                    if (!sameDay)
                    {
                        continue;
                    }

                    totalHours +=
                        (
                            oldClass.EndTime -
                            oldClass.StartTime
                        ).TotalHours;
                }

                if (totalHours > 10)
                {
                    throw new Exception(  $"Teaching hours on {day.DayOfWeek} exceed 10 hours ({totalHours:F1} hours)");
                }
            }

            foreach (var oldClass
    in existingClasses)
            {
                bool sameDay =
                    dto.ScheduleDays.Any(
                        newDay =>
                            oldClass.ClassScheduleDays
                                .Any(
                                    oldDay =>
                                        oldDay.DayOfWeek ==
                                        newDay.DayOfWeek));

                if (!sameDay)
                {
                    continue;
                }

                var oldStart =
                    oldClass.StartTime;

                var oldEnd =
                    oldClass.EndTime;

                bool conflict =
                    dto.StartTime <
                        oldEnd.Add(
                            TimeSpan.FromMinutes(30))
                    &&
                    dto.EndTime >
                        oldStart.Subtract(
                            TimeSpan.FromMinutes(30));

                if (conflict)
                {
                    throw new Exception(
                        $"Class '{oldClass.Title}' conflicts. Minimum 30 minutes break required.");
                }
            }

            var result =
                new List<ClassSessionDto>();

            var currentDate =
                DateOnly.FromDateTime(
                    dto.StartDate);

            int sessionNumber = 1;

            while (sessionNumber <= dto.TotalSessions)
            {
                if (
                    dto.ScheduleDays.Any(x =>
                        x.DayOfWeek ==
                        currentDate.DayOfWeek.ToString()))
                {
                    result.Add(
                        new ClassSessionDto
                        {
                            SessionNumber =
                                sessionNumber,

                            StudyDate =
                                currentDate,

                            StartTime =
                                dto.StartTime,

                            EndTime =
                                dto.EndTime,

                            Status =
                                "Upcoming"
                        });

                    sessionNumber++;
                }

                currentDate =
                    currentDate.AddDays(1);
            }

            return result;
        }

        public async Task<TeacherClassDto> CreateAsync(
                TeacherClassDto dto)
        {
            var email = _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!.Value;

            var teacherProfile =
                await _teacherProfileRepository
                    .GetByUserId(userId);

            if (teacherProfile == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }


            var teacherClass =
                _mapper.Map<TeacherClass>(dto);
            teacherClass.TeacherProfileId =
    teacherProfile.TeacherProfileId;
            teacherClass.CreatedDate =
                DateTime.Now;

            teacherClass.CurrentStudents = 0;

            await _teacherClassRepository
                .CreateAsync(
                    teacherClass);

            await _teacherClassRepository
                .SaveChangesAsync();

            var scheduleDays =
                dto.ScheduleDays
                    .Select(x =>
                        new ClassScheduleDay
                        {
                            ClassId =
                                teacherClass.ClassId,

                            DayOfWeek =
                                x.DayOfWeek
                        })
                    .ToList();

            await _classScheduleDayRepository
                .AddRangeAsync(
                    scheduleDays);

            var sessions =
                dto.Sessions
                    .Select(x =>
                        new ClassSession
                        {
                            ClassId =
                                teacherClass.ClassId,

                            SessionNumber =
                                x.SessionNumber,

                            StudyDate =
                                x.StudyDate,

                            StartTime =
                                x.StartTime,

                            EndTime =
                                x.EndTime,

                            Topic =
                                x.Topic,

                            Status =
                                "Upcoming"
                        })
                    .ToList();

            await _classSessionRepository
                .AddRangeAsync(
                    sessions);

            await _classScheduleDayRepository
                .SaveChangesAsync();

            return _mapper.Map<
                TeacherClassDto>(
                    teacherClass);
        }
        public async Task<List<TeacherClassDto>> SearchMyClassesAsync( ClassFilterDto filter)
        {
            var email= _userContext.GetEmail();
            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!.Value;
            var teacherProfile =
        await _teacherProfileRepository
            .GetByUserId(userId);

            if (teacherProfile == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }

            var classes =
                await _teacherClassRepository
                    .SearchMyClassesAsync(
                        filter,teacherProfile.TeacherProfileId);

            return _mapper.Map<
                List<TeacherClassDto>>(
                    classes);
        }

        public async Task<List<TeacherClassDto>> SearchClassesAsync(
    ClassFilterDto filter)
        {
            var classes =
                await _teacherClassRepository
                    .SearchClassesAsync(filter);

            return _mapper.Map<
                List<TeacherClassDto>>(
                    classes);
        }

        public async Task<TeacherClassDto> GetClassDetailAsync(int classId)
        {
            var teacherClass =
                await _teacherClassRepository
                    .GetByIdAsync(classId);

            if (teacherClass == null)
            {
                throw new Exception(
                    "Class not found");
            }

            return _mapper.Map<
                TeacherClassDto>(
                    teacherClass);
        }

        public async Task DeleteClassAsync(
    int classId)
        {
            var teacherClass =
                await _teacherClassRepository
                    .GetByIdAsync(
                        classId);

            if (teacherClass == null)
            {
                throw new Exception(
                    "Class not found");
            }

            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            var teacherProfile =
                await _teacherProfileRepository
                    .GetByUserId(userId);

            if (
                teacherProfile == null
                ||
                teacherClass.TeacherProfileId
                    != teacherProfile.TeacherProfileId
            )
            {
                throw new Exception(
                    "You do not have permission");
            }

            var enrolledCount =
    teacherClass.ClassEnrollments
        .Count(x =>
            x.Status == StatusBooking.Confirmed
            || x.Status == StatusBooking.InProgress
            || x.Status == StatusBooking.Completed);

            if (enrolledCount > 0)
            {
                throw new Exception(
                    "Cannot delete class because students have already enrolled");
            }

            await _teacherClassRepository
                .DeleteAsync(
                    teacherClass);

            await _teacherClassRepository
                .SaveChangesAsync();
        }

        public async Task UpdateSessionsAsync( int classId, List<ClassSessionDto> sessions)
        {
            var teacherClass =
                await _teacherClassRepository
                    .GetClassWithSessionsAsync(
                        classId);

            if (teacherClass == null)
            {
                throw new Exception(
                    "Class not found");
            }

            var enrolledCount =
    teacherClass.ClassEnrollments
        .Count(x =>
            x.Status == StatusBooking.Confirmed
            || x.Status == StatusBooking.InProgress
            || x.Status == StatusBooking.Completed);

            if (enrolledCount > 0)
            {
                throw new Exception(
                    "Cannot modify schedule because students have already enrolled");
            }

            foreach (var dto in sessions)
            {
                var session =
                    teacherClass.ClassSessions
                        .FirstOrDefault(x =>
                            x.SessionId ==
                            dto.SessionId);

                if (session == null)
                {
                    continue;
                }

                session.Topic =
                    dto.Topic;

                session.StudyDate =
                    dto.StudyDate;

                session.StartTime =
                    dto.StartTime;

                session.EndTime =
                    dto.EndTime;
            }

            await _teacherClassRepository
                .SaveChangesAsync();
        }

    }
}