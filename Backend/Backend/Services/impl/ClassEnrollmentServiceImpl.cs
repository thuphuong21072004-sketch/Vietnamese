using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;
using static Backend.common.Constant;

namespace Backend.Services.impl
{
    public class ClassEnrollmentServiceImpl
        : ClassEnrollmentService
    {
        private readonly ClassEnrollmentRepository
            _enrollmentRepository;

        private readonly UserContextUtil
            _userContext;

        private readonly UserRepository
            _userRepository;

        private readonly TeacherProfileRepository
            _teacherProfileRepository;

        private readonly TeacherClassRepository
            _teacherClassRepository;
        private readonly PaymentRepository _paymentRepository;

        public ClassEnrollmentServiceImpl(
            ClassEnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            UserContextUtil userContextUtil,
            TeacherProfileRepository teacherProfileRepository,
            TeacherClassRepository teacherClassRepository,
            PaymentRepository paymentRepository)
        {
            _enrollmentRepository =
                enrollmentRepository;

            _userRepository =
                userRepository;

            _userContext =
                userContextUtil;

            _teacherProfileRepository =
                teacherProfileRepository;

            _teacherClassRepository =
                teacherClassRepository;
            _paymentRepository = paymentRepository;
        }

        public async Task<int> EnrollAsync(int classId)
        {
            string email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            var teacherClass =
                await _teacherClassRepository
                    .GetById(classId);

            if (teacherClass == null)
            {
                throw new Exception(
                    "Class not found");
            }

            var activeCount =
                await _enrollmentRepository
                    .GetActiveEnrollmentCountAsync(classId);

            if (activeCount >= teacherClass.MaxStudents)
            {
                throw new Exception(
                    "This class is full");
            }

            var existed =
                await _enrollmentRepository
                    .GetEnrollmentAsync(
                        classId,
                        userId);

            if (existed != null)
            {
                if (
                    existed.Status ==
                    common.Constant.StatusBooking.PendingPayment
                )
                {
                    throw new Exception(
                        "You already have a pending enrollment for this class");
                }

                if (
                    existed.Status ==
                    common.Constant.StatusBooking.Confirmed
                    ||
                    existed.Status ==
                    common.Constant.StatusBooking.InProgress
                    ||
                    existed.Status ==
                    common.Constant.StatusBooking.Completed
                )
                {
                    throw new Exception(
                        "You have already enrolled this class");
                }

                if (existed.Status == common.Constant.StatusBooking.Cancelled)
                {
                    existed.Status =
                        common.Constant.StatusBooking.PendingPayment;

                    existed.EnrolledDate =
                        DateTime.Now;

                    await _enrollmentRepository
                        .UpdateAsync(existed);

                    return existed.EnrollmentId;
                }
            }

            var enrollment =
                new ClassEnrollment
                {
                    ClassId = classId,
                    StudentId = userId,
                    Status = common.Constant.StatusBooking.PendingPayment,
                    EnrolledDate = DateTime.Now
                };

            await _enrollmentRepository.CreateAsync(enrollment);

            return enrollment.EnrollmentId;
        }
        public async Task CancelAsync( int enrollmentId)
        {
            var enrollment =
                await _enrollmentRepository
                    .GetByIdAsync(
                        enrollmentId);

            if (enrollment == null)
            {
                throw new Exception(
                    "Enrollment not found");
            }

            if (enrollment.Status ==common.Constant.StatusBooking.Cancelled)
            {
                throw new Exception(
                    "Enrollment already cancelled");
            }

            var teacherClass =
                enrollment.TeacherClass;

            if (teacherClass == null)
            {
                throw new Exception(
                    "Class not found");
            }

            var firstSession =
                teacherClass.ClassSessions
                    .OrderBy(x => x.StudyDate)
                    .ThenBy(x => x.StartTime)
                    .FirstOrDefault();

            if (firstSession == null)
            {
                throw new Exception(
                    "Class has no sessions");
            }

            var firstStudyTime =
    firstSession.StudyDate
        .ToDateTime(
            TimeOnly.FromTimeSpan(
                firstSession.StartTime));

            if (DateTime.Now >=
                firstStudyTime.AddDays(-1))
            {
                throw new Exception(
                    "You can only cancel before 1 day of the first session");
            }

            bool decreaseStudent =
    enrollment.Status == StatusBooking.Confirmed
    || enrollment.Status == StatusBooking.InProgress
    || enrollment.Status == StatusBooking.Completed;

            enrollment.Status = StatusBooking.Cancelled;

            await _enrollmentRepository
                .UpdateAsync(enrollment);

            if (decreaseStudent)
            {
                if (teacherClass.CurrentStudents > 0)
                {
                    teacherClass.CurrentStudents--;
                }
            }

            await _teacherClassRepository
                .SaveChangesAsync();
        }

        public async Task<
            List<ClassEnrollmentDto>> GetMyClassesAsync()
        {
            string email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            var enrollments =
                await _enrollmentRepository
                    .GetStudentEnrollmentsAsync(
                        userId);
            foreach (var enrollment in enrollments)
            {
                await AutoUpdateStatus(enrollment);
            }

            return enrollments
    .Select(x =>
        new ClassEnrollmentDto
        {
            EnrollmentId = x.EnrollmentId,

            ClassId = x.ClassId,

            StudentId = x.StudentId,

            Status = x.Status,

            EnrolledDate = x.EnrolledDate,

            TeacherName =
                x.TeacherClass != null
                &&
                x.TeacherClass.TeacherProfile != null
                &&
                x.TeacherClass.TeacherProfile.User != null
                    ? x.TeacherClass.TeacherProfile.User.Name
                    : "",

            TeacherAvatarUrl =
                x.TeacherClass != null
                &&
                x.TeacherClass.TeacherProfile != null
                &&
                x.TeacherClass.TeacherProfile.User != null
                    ? x.TeacherClass.TeacherProfile.User.AvatarUrl
                    : "",

            TeacherCountry =
                x.TeacherClass != null
                &&
                x.TeacherClass.TeacherProfile != null
                &&
                x.TeacherClass.TeacherProfile.User != null
                    ? x.TeacherClass.TeacherProfile.User.Country
                    : "",

            ClassTitle =
    x.TeacherClass != null
        ? x.TeacherClass.Title
        : "",

            Price =
    x.TeacherClass != null
        ? x.TeacherClass.Price
        : 0,

            Description =
    x.TeacherClass != null
        ? x.TeacherClass.Description
        : "",

            MainTopic =
    x.TeacherClass != null
        ? x.TeacherClass.MainTopic
        : "",

            SubTopic =
    x.TeacherClass != null
        ? x.TeacherClass.SubTopic
        : "",

            TotalSessions =
    x.TeacherClass != null
        ? x.TeacherClass.TotalSessions
        : 0,

            CurrentStudents =
    x.TeacherClass != null
        ? x.TeacherClass.CurrentStudents
        : 0,

            MaxStudents =
    x.TeacherClass != null
        ? x.TeacherClass.MaxStudents
        : 0,

            StartTime =
    x.TeacherClass != null
        ? x.TeacherClass.StartTime
        : TimeSpan.Zero,

            EndTime =
    x.TeacherClass != null
        ? x.TeacherClass.EndTime
        : TimeSpan.Zero,

            ScheduleDays =
    x.TeacherClass != null
        ? x.TeacherClass.ClassScheduleDays
            .Select(d => d.DayOfWeek)
            .ToList()
        : new List<string>()

        })
    .ToList();
        }

        public async Task<List<ClassEnrollmentDto>> GetClassStudentsAsync(
        int classId)
        {
            var enrollments =
                await _enrollmentRepository
                    .GetClassEnrollmentsAsync(
                        classId);
            foreach (var enrollment in enrollments)
            {
                await AutoUpdateStatus(enrollment);
            }
            return enrollments
                .Select(x =>
                    new ClassEnrollmentDto
                    {
                        EnrollmentId =
                            x.EnrollmentId,

                        ClassId =
                            x.ClassId,

                        StudentId =
                            x.StudentId,

                        Status =
                            x.Status,

                        EnrolledDate =
                            x.EnrolledDate,

                        StudentName =
                            x.Student != null
                                ? x.Student.Name
                                : "",

                        StudentCountry =
                            x.Student != null
                                ? x.Student.Country
                                : "",

                        StudentAvatarUrl =
                            x.Student != null
                                ? x.Student.AvatarUrl
                                : ""
                    })
                .ToList();
        }

        public async Task< List<UpcomingScheduleDto>> GetStudentUpcomingScheduleAsync()
        {
            string email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            var enrollments =
                await _enrollmentRepository
                    .GetStudentEnrollmentsAsync(
                        userId);

            var today =
                DateOnly.FromDateTime(
                    DateTime.Today);

            return enrollments
                .Where(x =>
    x.Status == StatusBooking.Confirmed
    || x.Status == StatusBooking.InProgress)
                .SelectMany(x =>
                    x.TeacherClass!
                     .ClassSessions
                     .Where(s =>
                        s.StudyDate >= today)
                     .Select(s =>
                        new UpcomingScheduleDto
                        {
                            ClassId =
                                x.ClassId,

                            ClassTitle =
                                x.TeacherClass.Title,

                            SessionId =
                                s.SessionId,

                            SessionNumber =
                                s.SessionNumber,

                            Topic =
                                s.Topic,

                            StudyDate =
                                s.StudyDate,

                            StartTime =
                                s.StartTime,

                            EndTime =
                                s.EndTime,
                            TeacherName =
        x.TeacherClass.TeacherProfile != null &&
        x.TeacherClass.TeacherProfile.User != null
            ? x.TeacherClass.TeacherProfile.User.Name
            : "",
                        }))
                .OrderBy(x =>
                    x.StudyDate)
                .ThenBy(x =>
                    x.StartTime)
                .Take(10)
                .ToList();
        }

        public async Task<
            List<UpcomingScheduleDto>> GetTeacherUpcomingScheduleAsync()
        {
            string email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;


            var teacher =
                await _teacherProfileRepository.GetByUserId(userId);

            if (teacher == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }

            var classes =
                await _teacherClassRepository
                    .GetTeacherClassesAsync(
                        teacher.TeacherProfileId);

            var today =
                DateOnly.FromDateTime(
                    DateTime.Today);

            return classes
                .Where(x =>
                    x.CurrentStudents > 0)
                .SelectMany(x =>
                    x.ClassSessions
                     .Where(s =>
                        s.StudyDate >= today)
                     .Select(s =>
                        new UpcomingScheduleDto
                        {
                            ClassId =
                                x.ClassId,

                            ClassTitle =
                                x.Title,

                            SessionId =
                                s.SessionId,

                            SessionNumber =
                                s.SessionNumber,

                            Topic =
                                s.Topic,

                            StudyDate =
                                s.StudyDate,

                            StartTime =
                                s.StartTime,

                            EndTime =
                                s.EndTime
                        }))
                .OrderBy(x =>
                    x.StudyDate)
                .ThenBy(x =>
                    x.StartTime)
                .Take(10)
                .ToList();
        }

        private async Task AutoUpdateStatus( ClassEnrollment enrollment)
        {
            if (enrollment.TeacherClass == null)
            {
                return;
            }
            if (
    enrollment.Status ==
    StatusBooking.PendingPayment
)
            {
                var payment =
                    await _paymentRepository
                        .GetByRef(
                            RefName.Class,
                            enrollment.EnrollmentId);

                if (
                    payment != null
                    &&
                    (
                        payment.Status ==
                        StatusPayment.Pending
                        ||
                        payment.Status ==
                        StatusPayment.Failed
                    )
                    &&
                    payment.CreatedDate
                        .AddMinutes(15)
                    <= DateTime.Now
                )
                {
                    payment.Status =
                        StatusPayment.Expired;

                    enrollment.Status =
                        StatusBooking.Cancelled;

                    await _paymentRepository
                        .Update(payment);

                    await _paymentRepository
                        .Save();

                    await _enrollmentRepository
                        .UpdateAsync(
                            enrollment);

                    return;
                }
            }

            var sessions =
                enrollment.TeacherClass.ClassSessions
                    .OrderBy(x => x.StudyDate)
                    .ThenBy(x => x.StartTime)
                    .ToList();

            if (!sessions.Any())
            {
                return;
            }

            var firstSession = sessions.First();

            var lastSession = sessions.Last();

            var firstStart =
                firstSession.StudyDate
                    .ToDateTime(
                        TimeOnly.FromTimeSpan(
                            firstSession.StartTime));

            var lastEnd =
                lastSession.StudyDate
                    .ToDateTime(
                        TimeOnly.FromTimeSpan(
                            lastSession.EndTime));

            var now = DateTime.Now;

            if (
                enrollment.Status == StatusBooking.Confirmed
                &&
                now >= firstStart
                &&
                now < lastEnd
            )
            {
                enrollment.Status =
                    StatusBooking.InProgress;

                await _enrollmentRepository
                    .UpdateAsync(enrollment);

                return;
            }

            if (
                (
                    enrollment.Status == StatusBooking.Confirmed
                    ||
                    enrollment.Status == StatusBooking.InProgress
                )
                &&
                now >= lastEnd
            )
            {
                enrollment.Status =
                    StatusBooking.Completed;

                await _enrollmentRepository
                    .UpdateAsync(enrollment);
            }
        }

        public async Task<ClassEnrollment> GetDetailAsync(
    int enrollmentId)
        {
            var enrollment =
                await _enrollmentRepository
                    .GetByIdAsync(
                        enrollmentId);

            if (enrollment == null)
            {
                throw new Exception(
                    "Enrollment not found");
            }

            await AutoUpdateStatus(
                enrollment);
            Console.WriteLine(
    enrollment.TeacherClass?.Price);

            return enrollment;
        }
    }
}