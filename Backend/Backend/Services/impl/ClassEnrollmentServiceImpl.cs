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
        private readonly ReviewRepository _reviewRepository;

        public ClassEnrollmentServiceImpl(
            ClassEnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            UserContextUtil userContextUtil,
            TeacherProfileRepository teacherProfileRepository,
            TeacherClassRepository teacherClassRepository,
            PaymentRepository paymentRepository,
            ReviewRepository reviewRepository)
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
            _reviewRepository = reviewRepository;
        }

        public async Task<(int enrollmentId, int status)> EnrollAsync(int classId)
        {
            string email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            var teacherClass =
                await _teacherClassRepository
                    .GetByIdAsync(classId);

            if (teacherClass == null)
            {
                throw new Exception(
                    "Class not found");
            }

            var activeCount =
                await _enrollmentRepository
                    .GetActiveEnrollmentCountAsync(classId);

            int effectiveMax = teacherClass.MaxStudents;
            if (teacherClass.ReservedStudentId.HasValue && userId != teacherClass.ReservedStudentId.Value)
                effectiveMax = teacherClass.MaxStudents - 1;

            if (activeCount >= effectiveMax)
            {
                throw new Exception(
                    "This class is full");
            }

            // Schedule conflict check
            var existingEnrollments =
                await _enrollmentRepository
                    .GetStudentEnrollmentsAsync(userId);

            var gap = TimeSpan.FromMinutes(15);

            foreach (var newSession in teacherClass.ClassSessions)
            {
                foreach (var enrolled in existingEnrollments
                    .Where(e =>
                        e.ClassId != classId &&
                        (e.Status == common.Constant.StatusBooking.Confirmed ||
                         e.Status == common.Constant.StatusBooking.InProgress)))
                {
                    var conflict = enrolled.TeacherClass?.ClassSessions
                        .FirstOrDefault(s =>
                            s.StudyDate == newSession.StudyDate &&
                            newSession.StartTime < s.EndTime + gap &&
                            s.StartTime < newSession.EndTime + gap);

                    if (conflict != null)
                    {
                        throw new Exception(
                            $"Schedule conflict with class \"{enrolled.TeacherClass!.Title}\" on {newSession.StudyDate:dd/MM/yyyy} " +
                            $"({newSession.StartTime:hh\\:mm}–{newSession.EndTime:hh\\:mm}). " +
                            $"Sessions must be at least 15 minutes apart.");
                    }
                }
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
                    var alreadyPaid = await _paymentRepository
                        .GetSuccessPaymentByRef(
                            common.Constant.RefName.Class,
                            existed.EnrollmentId);

                    if (alreadyPaid != null)
                    {
                        existed.Status = common.Constant.StatusBooking.Confirmed;
                        existed.EnrolledDate = DateTime.UtcNow;
                        await _enrollmentRepository.UpdateAsync(existed);

                        var cls = await _teacherClassRepository.GetByIdAsync(existed.ClassId);
                        if (cls != null)
                        {
                            cls.CurrentStudents++;
                            await _teacherClassRepository.SaveChangesAsync();
                        }

                        return (existed.EnrollmentId, existed.Status);
                    }

                    existed.Status =
                        common.Constant.StatusBooking.PendingPayment;

                    existed.EnrolledDate =
                        DateTime.UtcNow;

                    await _enrollmentRepository
                        .UpdateAsync(existed);

                    return (existed.EnrollmentId, existed.Status);
                }
            }

            var enrollment =
                new ClassEnrollment
                {
                    ClassId = classId,
                    StudentId = userId,
                    Status = common.Constant.StatusBooking.PendingPayment,
                    EnrolledDate = DateTime.UtcNow
                };

            await _enrollmentRepository.CreateAsync(enrollment);

            // If this class reserved a slot for this student, release other reservations for the SAME trip only
            if (teacherClass.ReservedStudentId == userId)
            {
                var allReserved = await _teacherClassRepository.GetByReservedStudentIdAsync(userId);
                foreach (var cls in allReserved)
                {
                    if (cls.ClassId == classId) continue; // keep the enrolled class's reservation
                    if (cls.TripId != teacherClass.TripId) continue; // don't touch other trips
                    cls.ReservedStudentId = null;
                    cls.TripId = null;
                    await _teacherClassRepository.UpdateAsync(cls);
                }
                await _teacherClassRepository.SaveChangesAsync();
            }

            return (enrollment.EnrollmentId, enrollment.Status);
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

            if (DateTime.UtcNow >=
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

            // Only process non-terminal enrollments
            var active = enrollments
                .Where(e => e.Status == StatusBooking.PendingPayment
                         || e.Status == StatusBooking.Confirmed
                         || e.Status == StatusBooking.InProgress)
                .ToList();

            if (active.Any())
            {
                // Batch-load payments for all PendingPayment enrollments in one query
                var pendingIds = active
                    .Where(e => e.Status == StatusBooking.PendingPayment)
                    .Select(e => e.EnrollmentId)
                    .ToList();

                var paymentMap = pendingIds.Any()
                    ? await _paymentRepository.GetLatestByRefs(RefName.Class, pendingIds)
                    : new Dictionary<int, Payment>();

                bool anyChanged = false;
                var now = DateTime.UtcNow;

                foreach (var e in active)
                    anyChanged |= ApplyAutoStatus(e, paymentMap, now);

                if (anyChanged)
                    await _enrollmentRepository.SaveChangesAsync();
            }

            var completedClassIds = enrollments
                .Where(e => e.Status == StatusBooking.Completed)
                .Select(e => e.ClassId)
                .ToList();

            var reviewedIds = completedClassIds.Any()
                ? await _reviewRepository.GetReviewedRefIdsByStudent(
                    "CLASS", userId, completedClassIds)
                : new HashSet<int>();

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
            .Select(d => new ClassScheduleDayDto
            {
                Id = d.Id,
                ClassId = d.ClassId,
                DayOfWeek = d.DayOfWeek
            })
            .ToList()
        : new List<ClassScheduleDayDto>(),

            Sessions =
    x.TeacherClass != null
        ? x.TeacherClass.ClassSessions
            .Select(s => new ClassSessionDto
            {
                SessionId = s.SessionId,
                ClassId = s.ClassId,
                SessionNumber = s.SessionNumber,
                StudyDate = s.StudyDate,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                Topic = s.Topic,
                Status = s.Status
            })
            .OrderBy(s => s.StudyDate)
            .ThenBy(s => s.StartTime)
            .ToList()
        : new List<ClassSessionDto>(),

            HasReview = reviewedIds.Contains(x.ClassId)

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

            // Session times stored as Vietnam local (UTC+7); convert to UTC for comparison
            var vnOffset = TimeSpan.FromHours(7);
            var cutoff = DateTime.UtcNow.AddMinutes(-15);

            return enrollments
                .Where(x =>
                    x.Status == StatusBooking.Confirmed
                    || x.Status == StatusBooking.InProgress)
                .SelectMany(x =>
                    x.TeacherClass!
                     .ClassSessions
                     .Where(s =>
                        s.StudyDate.ToDateTime(TimeOnly.MinValue).Add(s.EndTime) - vnOffset > cutoff)
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
                    x.StudyDate.ToDateTime(TimeOnly.MinValue).Add(x.StartTime))
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

            // Session times stored as Vietnam local (UTC+7); convert to UTC for comparison
            var vnOffset = TimeSpan.FromHours(7);
            var cutoff = DateTime.UtcNow.AddMinutes(-15);

            return classes
                .Where(x =>
                    x.CurrentStudents > 0)
                .SelectMany(x =>
                    x.ClassSessions
                     .Where(s =>
                        s.StudyDate.ToDateTime(TimeOnly.MinValue).Add(s.EndTime) - vnOffset > cutoff)
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
                    x.StudyDate.ToDateTime(TimeOnly.MinValue).Add(x.StartTime))
                .Take(10)
                .ToList();
        }

        // Batch-friendly: mutates entity only, caller saves once at the end
        private bool ApplyAutoStatus(
            ClassEnrollment enrollment,
            Dictionary<int, Payment> paymentMap,
            DateTime now)
        {
            if (enrollment.TeacherClass == null) return false;

            if (enrollment.Status == StatusBooking.PendingPayment)
            {
                paymentMap.TryGetValue(enrollment.EnrollmentId, out var payment);
                if (payment != null
                    && (payment.Status == StatusPayment.Pending || payment.Status == StatusPayment.Failed)
                    && payment.CreatedDate.AddMinutes(15) <= now)
                {
                    payment.Status = StatusPayment.Expired;
                    enrollment.Status = StatusBooking.Cancelled;
                    return true;
                }
                return false;
            }

            var sessions = enrollment.TeacherClass.ClassSessions
                .OrderBy(x => x.StudyDate).ThenBy(x => x.StartTime).ToList();

            if (!sessions.Any()) return false;

            var firstStart = sessions.First().StudyDate.ToDateTime(
                TimeOnly.FromTimeSpan(sessions.First().StartTime));
            var lastEnd = sessions.Last().StudyDate.ToDateTime(
                TimeOnly.FromTimeSpan(sessions.Last().EndTime));

            if (enrollment.Status == StatusBooking.Confirmed && now >= firstStart && now < lastEnd)
            {
                enrollment.Status = StatusBooking.InProgress;
                return true;
            }

            if ((enrollment.Status == StatusBooking.Confirmed
                 || enrollment.Status == StatusBooking.InProgress)
                && now >= lastEnd)
            {
                enrollment.Status = StatusBooking.Completed;
                return true;
            }

            return false;
        }

        // Single-enrollment version (used by GetDetailAsync)
        private async Task AutoUpdateStatus( ClassEnrollment enrollment)
        {
            if (enrollment.TeacherClass == null) return;

            if (enrollment.Status == StatusBooking.Completed
                || enrollment.Status == StatusBooking.Cancelled) return;

            var payment = enrollment.Status == StatusBooking.PendingPayment
                ? await _paymentRepository.GetByRef(RefName.Class, enrollment.EnrollmentId)
                : null;

            bool changed = ApplyAutoStatus(enrollment, payment != null
                ? new Dictionary<int, Payment> { [enrollment.EnrollmentId] = payment }
                : new Dictionary<int, Payment>(), DateTime.UtcNow);

            if (changed)
            {
                if (payment?.Status == StatusPayment.Expired)
                    await _paymentRepository.Save();
                await _enrollmentRepository.UpdateAsync(enrollment);
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