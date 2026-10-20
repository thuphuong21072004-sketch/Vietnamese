using AutoMapper;
using Backend.Common;
using Backend.Data;
using Backend.dto;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Backend.common.Constant;

namespace Backend.Services.impl
{
    public class TravelServiceImpl : TravelService
    {
        private readonly TeacherScheduleRepository
            _teacherScheduleRepository;

        private readonly StudentTripRepository
            _studentTripRepository;

        private readonly MatchRequestRepository
            _matchRequestRepository;

        private readonly UserRepository
            _userRepository;

        private readonly UserContextUtil
            _userContext;

        private readonly IMapper
            _mapper;
        private readonly TravelBookingRepository _travelBookingRepository;
        private readonly TeacherClassRepository _teacherClassRepository;
        private readonly AppDbContext _context;

        public TravelServiceImpl(
            TeacherScheduleRepository teacherScheduleRepository,
            StudentTripRepository studentTripRepository,
            MatchRequestRepository matchRequestRepository,
            UserRepository userRepository,
            UserContextUtil userContext,
            IMapper mapper,
            TravelBookingRepository travelBookingRepository,
            TeacherClassRepository teacherClassRepository,
            AppDbContext context)
        {
            _teacherScheduleRepository =
                teacherScheduleRepository;

            _studentTripRepository =
                studentTripRepository;

            _matchRequestRepository =
                matchRequestRepository;

            _userRepository =
                userRepository;

            _userContext =
                userContext;

            _mapper =
                mapper;
            _travelBookingRepository = travelBookingRepository;
            _teacherClassRepository = teacherClassRepository;
            _context = context;
        }
        public async Task<TeacherScheduleDto>
    CreateTeacherSchedule(
        TeacherScheduleDto dto)
        {
            if (
                dto.AvailableFrom >
                dto.AvailableTo)
            {
                throw new Exception(
                    "Invalid date range");
            }

            var email =
                _userContext.GetEmail();

            int teacherId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                .Value;

            var schedules =
                await _teacherScheduleRepository
                    .GetByTeacherId(
                        teacherId);

            bool overlap =
                schedules.Any(x =>

                    x.Status ==
                    TeacherScheduleStatus.Open

                    &&

                    x.AvailableFrom
                        <= dto.AvailableTo

                    &&

                    x.AvailableTo
                        >= dto.AvailableFrom);

            if (overlap)
            {
                throw new Exception(
                    "Schedule dates overlap");
            }

            var entity =
                new TeacherSchedule
                {
                    TeacherId =
                        teacherId,

                    Destination =
                        dto.Destination
                            .Trim(),

                    AvailableFrom =
                        dto.AvailableFrom,

                    AvailableTo =
                        dto.AvailableTo,

                    Status =
                        TeacherScheduleStatus
                            .Open,

                    CreatedAt =
                        DateTime.UtcNow
                };

            await _teacherScheduleRepository
                .Create(entity);

            await _teacherScheduleRepository
                .Save();

            return _mapper.Map<
                TeacherScheduleDto>(
                    entity);
        }
        public async Task< List<TeacherScheduleDto>> GetMyTeacherSchedules()
        {
            var email =
                _userContext.GetEmail();

            int teacherId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                .Value;

            var data =
                await _teacherScheduleRepository
                    .GetByTeacherId(
                        teacherId);

            var dtos = _mapper.Map<
                List<TeacherScheduleDto>>
                (data);

            var allRequests =
                await _matchRequestRepository
                    .GetByTeacherId(teacherId);

            var activeScheduleIds =
                allRequests
                    .Where(r =>
                        r.Status ==
                        MatchRequestStatus.Pending
                        ||
                        r.Status ==
                        MatchRequestStatus.Accepted)
                    .Select(r => r.ScheduleId)
                    .ToHashSet();

            foreach (var dto in dtos)
            {
                dto.HasActiveRequest =
                    activeScheduleIds.Contains(
                        dto.ScheduleId);
            }

            return dtos
                .OrderBy(d => d.AvailableFrom)
                .ToList();
        }
        public async Task<StudentTripDto> CreateTrip( StudentTripDto dto)
        {
            if (
                dto.StartDate >
                dto.EndDate
            )
            {
                throw new Exception(
                    "Invalid date range");
            }

            var minStart =
                common.VnTime.Today.AddDays(30);

            if (dto.StartDate < minStart)
            {
                throw new Exception(
                    "Start date must be at least 30 days from today");
            }

            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                .Value;


            var existingTrips =
                await _studentTripRepository
                    .GetByStudentId(userId);

            bool overlap =
                existingTrips.Any(x =>
                    x.Status !=
                    StudentTripStatus.Cancelled
                    &&
                    x.StartDate <= dto.EndDate
                    &&
                    x.EndDate >= dto.StartDate);

            if (overlap)
            {
                throw new Exception(
                    "Trip dates overlap with another trip");
            }

            var trip =
                new StudentTrip
                {
                    StudentId = userId,

                    Destination =
                        dto.Destination.Trim(),

                    SpecificLocation =
                        dto.SpecificLocation,

                    PhoneNumber =
                        dto.PhoneNumber,

                    StartDate =
                        dto.StartDate,

                    EndDate =
                        dto.EndDate,

                    Status =
                        StudentTripStatus
                            .FindingTeacher,

                    CreatedAt =
                        DateTime.UtcNow
                };

            await _studentTripRepository
                .Create(trip);

            await _studentTripRepository
                .Save();

            return _mapper.Map<
                StudentTripDto>(
                    trip);
        }
        public async Task<List<StudentTripDto>> GetMyTrips()
        {
            var email = _userContext.GetEmail();

            int studentId =
                (await _userRepository.GetUserIdByEmail(email)).Value;

            var data =
                await _studentTripRepository.GetByStudentId(studentId);

            var today = common.VnTime.Today; // ngày chuyến đi theo lịch Việt Nam
            var deadline = today.AddDays(10);

            // Auto-cancel trips that are still FindingTeacher but too close to start
            bool anyChanged = false;
            foreach (var trip in data)
            {
                if (trip.Status == StudentTripStatus.FindingTeacher
                    && trip.StartDate <= deadline)
                {
                    trip.Status = StudentTripStatus.Cancelled;
                    anyChanged = true;
                }
            }
            if (anyChanged)
                await _studentTripRepository.Save();

            // Filter out trips whose end date has already passed
            var visible = data
                .Where(t => t.EndDate >= today)
                .OrderBy(t => t.StartDate)
                .ToList();

            var dtos = _mapper.Map<List<StudentTripDto>>(visible);

            var acceptedRequests =
                await _matchRequestRepository.GetByStudentId(studentId);

            var acceptedByTrip = acceptedRequests
                .Where(r => r.Status == MatchRequestStatus.Accepted)
                .GroupBy(r => r.TripId)
                .ToDictionary(g => g.Key, g => g.First());

            foreach (var dto in dtos)
            {
                if (acceptedByTrip.TryGetValue(dto.TripId, out var req))
                {
                    dto.MatchedTeacherId = req.Schedule?.TeacherId;
                    dto.MatchedTeacherName = req.Schedule?.Teacher?.Name;
                    dto.ClassId = req.ClassId;
                }
            }

            // Check if student has enrolled+paid in a class reserved for each specific trip
            // (applies whether the trip is still FindingTeacher or already Matched)
            var enrolledReservations = await _context.ClassEnrollments
                .Where(e =>
                    e.StudentId == studentId &&
                    (e.Status == 1 || e.Status == 2 || e.Status == 3) &&
                    e.TeacherClass!.ReservedStudentId == studentId &&
                    e.TeacherClass.TripId.HasValue)
                .Select(e => new { e.ClassId, e.TeacherClass!.Title, TripId = e.TeacherClass.TripId!.Value })
                .ToListAsync();

            foreach (var dto in dtos)
            {
                var match = enrolledReservations.FirstOrDefault(c => c.TripId == dto.TripId);
                if (match != null)
                {
                    dto.EnrolledClassId = match.ClassId;
                    dto.EnrolledClassName = match.Title;
                }
            }

            return dtos;
        }
        public async Task SendRequest( int scheduleId, int tripId, byte requestType)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                .Value;

            var schedule =
                await _teacherScheduleRepository
                    .GetById(scheduleId);

            if (schedule == null)
            {
                throw new Exception(
                    "Schedule not found");
            }

            var trip =
                await _studentTripRepository
                    .GetById(tripId);

            if (trip == null)
            {
                throw new Exception(
                    "Trip not found");
            }

            if (
                requestType ==
                MatchRequestType.StudentInvite
            )
            {
                if (trip.StudentId != userId)
                {
                    throw new Exception(
                        "No permission");
                }
            }
            else if (
                requestType ==
                MatchRequestType.TeacherInvite
            )
            {
                if (schedule.TeacherId != userId)
                {
                    throw new Exception(
                        "No permission");
                }
            }
            else
            {
                throw new Exception(
                    "Invalid request type");
            }

            if (
                schedule.Status !=
                TeacherScheduleStatus.Open
            )
            {
                throw new Exception(
                    "Schedule closed");
            }

            if (
                trip.Status ==
                StudentTripStatus.Matched
            )
            {
                throw new Exception(
                    "Trip already matched");
            }

            bool destinationMatch =
                schedule.Destination.ToLower().Contains(trip.Destination.ToLower())
                || trip.Destination.ToLower().Contains(schedule.Destination.ToLower());

            if (!destinationMatch)
            {
                throw new Exception(
                    "Destination does not match");
            }

            bool overlap =
                schedule.AvailableFrom <=
                trip.EndDate
                &&
                schedule.AvailableTo >=
                trip.StartDate;

            if (!overlap)
            {
                throw new Exception(
                    "Dates do not match");
            }

            var exist =
                await _matchRequestRepository
                    .GetByScheduleAndTrip(
                        scheduleId,
                        tripId);

            if (exist != null)
            {
                if (exist.Status ==
                    MatchRequestStatus.Cancelled
                    ||
                    exist.Status ==
                    MatchRequestStatus.Rejected)
                {
                    exist.Status =
                        MatchRequestStatus.Pending;
                    exist.RequestType = requestType;
                    exist.CreatedAt = DateTime.UtcNow;
                    await _matchRequestRepository
                        .Update(exist);
                    await _matchRequestRepository
                        .Save();
                    return;
                }

                throw new Exception(
                    "Request already exists");
            }

            var request =
                new MatchRequest
                {
                    ScheduleId = scheduleId,

                    TripId = tripId,

                    RequestType = requestType,

                    Status =
                        MatchRequestStatus.Pending,

                    CreatedAt =
                        DateTime.UtcNow
                };

            await _matchRequestRepository
                .Create(request);

            await _matchRequestRepository
                .Save();
        }
        public async Task AcceptRequest( int requestId)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                ?? throw new Exception(
                    "User not found");

            var request =
                await _matchRequestRepository
                    .GetById(requestId);

            if (request == null)
            {
                throw new Exception(
                    "Request not found");
            }

            if (
                request.Status !=
                MatchRequestStatus.Pending
            )
            {
                throw new Exception(
                    "Request already processed");
            }

            var schedule =
                await _teacherScheduleRepository
                    .GetById(
                        request.ScheduleId);

            var trip =
                await _studentTripRepository
                    .GetById(
                        request.TripId);

            if (
                schedule == null ||
                trip == null
            )
            {
                throw new Exception(
                    "Data not found");
            }

            bool canAccept =
                request.RequestType ==
                MatchRequestType.StudentInvite
                ? schedule.TeacherId == userId
                : trip.StudentId == userId;

            if (!canAccept)
            {
                throw new Exception(
                    "No permission");
            }

            bool conflict =
                await _travelBookingRepository
                    .HasConflictBooking(
                        request.ScheduleId,
                        trip.StartDate,
                        trip.EndDate);

            if (conflict)
            {
                throw new Exception(
                    "Teacher already has another booking in this period");
            }

            request.Status =
                MatchRequestStatus.Accepted;

            request.RespondedAt =
                DateTime.UtcNow;

            trip.Status =
                StudentTripStatus.Matched;

            var booking =
                new TravelBooking
                {
                    ScheduleId =
                        request.ScheduleId,

                    TripId =
                        request.TripId,

                    Destination =
                        trip.Destination,

                    StartDate =
                        trip.StartDate,

                    EndDate =
                        trip.EndDate,

                    Status =
                        TravelBookingStatus
                            .Confirmed,

                    CreatedAt =
                        DateTime.UtcNow
                };

            await _travelBookingRepository
                .Create(
                    booking);

            // Cancel all other pending requests for the same schedule
            var sameScheduleRequests =
                await _matchRequestRepository
                    .GetByScheduleId(request.ScheduleId);

            foreach (var item in sameScheduleRequests)
            {
                if (item.MatchRequestId == requestId) continue;

                if (item.Status == MatchRequestStatus.Pending)
                {
                    item.Status = MatchRequestStatus.Cancelled;
                    item.RespondedAt = DateTime.UtcNow;
                }
            }

            // Cancel all other pending requests for the same trip (student already found a teacher)
            var sameTripRequests =
                await _matchRequestRepository
                    .GetByTripId(trip.TripId);

            foreach (var item in sameTripRequests)
            {
                if (item.MatchRequestId == requestId) continue;

                if (item.Status == MatchRequestStatus.Pending)
                {
                    item.Status = MatchRequestStatus.Cancelled;
                    item.RespondedAt = DateTime.UtcNow;
                }
            }

            await _studentTripRepository
                .Save();
        }
        public async Task RejectRequest( int requestId)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                ?? throw new Exception(
                    "User not found");

            var request =
                await _matchRequestRepository
                    .GetById(requestId);

            if (request == null)
            {
                throw new Exception(
                    "Request not found");
            }

            if (
                request.Status !=
                MatchRequestStatus.Pending
            )
            {
                throw new Exception(
                    "Request already processed");
            }

            var schedule =
                await _teacherScheduleRepository
                    .GetById(
                        request.ScheduleId);

            var trip =
                await _studentTripRepository
                    .GetById(
                        request.TripId);

            bool canReject =
                request.RequestType ==
                MatchRequestType.StudentInvite
                ? schedule?.TeacherId == userId
                : trip?.StudentId == userId;

            if (!canReject)
            {
                throw new Exception(
                    "No permission");
            }

            request.Status =
                MatchRequestStatus.Rejected;

            request.RespondedAt =
                DateTime.UtcNow;

            await _matchRequestRepository
                .Update(request);

            await _matchRequestRepository
                .Save();
        }
        public async Task CancelRequest( int requestId)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                .Value;

            var request =
                await _matchRequestRepository
                    .GetById(requestId);

            if (request == null)
            {
                throw new Exception(
                    "Request not found");
            }

            if (
                request.Status !=
                MatchRequestStatus.Pending
            )
            {
                throw new Exception(
                    "Request already processed");
            }

            var schedule =
                await _teacherScheduleRepository
                    .GetById(
                        request.ScheduleId);

            var trip =
                await _studentTripRepository
                    .GetById(
                        request.TripId);

            bool isOwner =
                request.RequestType ==
                MatchRequestType.StudentInvite
                ? trip?.StudentId == userId
                : schedule?.TeacherId == userId;

            if (!isOwner)
            {
                throw new Exception(
                    "No permission");
            }

            request.Status =
                MatchRequestStatus.Cancelled;

            request.RespondedAt =
                DateTime.UtcNow;

            await _matchRequestRepository
                .Update(request);

            await _matchRequestRepository
                .Save();
        }
        public async Task<List<TeacherScheduleDto>> GetSuggestedTeachers(
        int tripId)
        {
            var trip =
                await _studentTripRepository
                    .GetById(tripId);

            if (trip == null)
            {
                throw new Exception(
                    "Trip not found");
            }

            var schedules =
                await _teacherScheduleRepository
                    .GetSuggestedTeachers(
                        trip.Destination,
                        trip.StartDate,
                        trip.EndDate);

            var availableSchedules =
                new List<TeacherSchedule>();

            foreach (
                var schedule
                in schedules)
            {
                bool conflict =
                    await _travelBookingRepository
                        .HasConflictBooking(
                            schedule.ScheduleId,
                            trip.StartDate,
                            trip.EndDate);

                if (!conflict)
                {
                    availableSchedules
                        .Add(schedule);
                }
            }

            return _mapper.Map<
                List<TeacherScheduleDto>>(
                    availableSchedules);
        }
        public async Task<List<StudentTripDto>> GetSuggestedStudents(int scheduleId)
        {
            var schedule =
                await _teacherScheduleRepository
                    .GetById(scheduleId);

            if (schedule == null)
                throw new Exception("Schedule not found");

            var data =
                await _studentTripRepository
                    .GetSuggestedStudents(
                        schedule.Destination,
                        schedule.AvailableFrom,
                        schedule.AvailableTo);

            var available = new List<StudentTrip>();

            foreach (var trip in data)
            {
                bool conflict =
                    await _travelBookingRepository
                        .HasConflictBooking(
                            scheduleId,
                            trip.StartDate,
                            trip.EndDate);

                if (!conflict)
                    available.Add(trip);
            }

            return _mapper.Map<List<StudentTripDto>>(available);
        }

        public async Task<List<StudentTripDto>> GetOpenStudentTrips(string? destination)
        {
            var trips = await _studentTripRepository.GetAllOpen(destination);
            var dtos = _mapper.Map<List<StudentTripDto>>(trips);

            if (dtos.Count > 0)
            {
                var tripIds = dtos.Select(d => d.TripId).ToList();
                // Flag HasEnrolledInClass per trip: student confirmed enrollment in a class
                // reserved specifically for that trip (TripId matches)
                var enrolledTripIds = await _context.ClassEnrollments
                    .Where(e =>
                        (e.Status == 1 || e.Status == 2 || e.Status == 3) &&
                        e.TeacherClass!.TripId.HasValue &&
                        tripIds.Contains(e.TeacherClass.TripId!.Value))
                    .Select(e => e.TeacherClass!.TripId!.Value)
                    .Distinct()
                    .ToListAsync();

                var enrolledTripSet = enrolledTripIds.ToHashSet();
                foreach (var dto in dtos)
                    dto.HasEnrolledInClass = enrolledTripSet.Contains(dto.TripId);
            }

            return dtos;
        }

        public async Task<List<TravelBookingDto>> GetMyConfirmedBookings()
        {
            var email = _userContext.GetEmail();
            int teacherId = (await _userRepository.GetUserIdByEmail(email)).Value;
            var bookings = await _travelBookingRepository.GetConfirmedByTeacherId(teacherId);
            return _mapper.Map<List<TravelBookingDto>>(bookings);
        }

        public async Task<List<MatchRequestDto>> GetIncomingRequests()
        {
            var email = _userContext.GetEmail();

            int userId =
                (await _userRepository.GetUserIdByEmail(email)).Value;

            var teacherRequests =
                await _matchRequestRepository.GetPendingByTeacherId(userId);

            var studentRequests =
                await _matchRequestRepository.GetPendingByStudentId(userId);

            var today = common.VnTime.Today; // ngày chuyến đi theo lịch Việt Nam

            var requests = teacherRequests
                .Concat(studentRequests)
                .Where(x => x.Trip != null && x.Trip.EndDate >= today)
                .OrderBy(x => x.Trip!.StartDate)
                .ToList();

            return _mapper.Map<List<MatchRequestDto>>(requests);
        }

        public async Task<List<MatchRequestDto>> GetOutgoingRequests()
        {
            var email = _userContext.GetEmail();

            int userId =
                (await _userRepository.GetUserIdByEmail(email)).Value;

            var teacherRequests =
                await _matchRequestRepository.GetByTeacherId(userId);

            var studentRequests =
                await _matchRequestRepository.GetByStudentId(userId);

            var today = common.VnTime.Today; // ngày chuyến đi theo lịch Việt Nam

            var requests = teacherRequests
                .Concat(studentRequests)
                .Where(x => x.Trip != null && x.Trip.EndDate >= today)
                .OrderBy(x => x.Trip!.StartDate)
                .ToList();

            return _mapper.Map<List<MatchRequestDto>>(requests);
        }
        public async Task<MatchRequestDto?> GetRequestDetail( int requestId)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                .Value;

            var request =
                await _matchRequestRepository
                    .GetById(requestId);

            if (request == null)
            {
                throw new Exception(
                    "Request not found");
            }

            var schedule =
                await _teacherScheduleRepository
                    .GetById(
                        request.ScheduleId);

            var trip =
                await _studentTripRepository
                    .GetById(
                        request.TripId);

            if (
                schedule == null ||
                trip == null
            )
            {
                throw new Exception(
                    "Data not found");
            }

            bool canView =
                schedule.TeacherId == userId
                ||
                trip.StudentId == userId;

            if (!canView)
            {
                throw new Exception(
                    "No permission");
            }

            return _mapper.Map<
                MatchRequestDto>(
                    request);
        }

        public async Task<TeacherScheduleDto> UpdateTeacherSchedule( int scheduleId, TeacherScheduleDto dto)
        {
            if (
                dto.AvailableFrom >
                dto.AvailableTo
            )
            {
                throw new Exception(
                    "Invalid date range");
            }

            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                .Value;

            var schedule =
                await _teacherScheduleRepository
                    .GetById(scheduleId);

            if (schedule == null)
            {
                throw new Exception(
                    "Schedule not found");
            }

            if (
                schedule.TeacherId !=
                userId
            )
            {
                throw new Exception(
                    "No permission");
            }

            var requests =
                await _matchRequestRepository
                    .GetByScheduleId(
                        scheduleId);

            if (
                requests.Any(x =>
                    x.Status ==
                    MatchRequestStatus
                        .Accepted)
            )
            {
                throw new Exception(
                    "Schedule already matched");
            }

            var schedules =
    await _teacherScheduleRepository
        .GetByTeacherId(
            userId);

            bool overlap =
                schedules.Any(x =>

                    x.ScheduleId !=
                    scheduleId

                    &&

                    x.Status ==
                    TeacherScheduleStatus.Open

                    &&

                    x.AvailableFrom
                        <= dto.AvailableTo

                    &&

                    x.AvailableTo
                        >= dto.AvailableFrom);

            if (overlap)
            {
                throw new Exception(
                    "Schedule dates overlap");
            }

            if (
                dto.Status !=
                TeacherScheduleStatus.Open
                &&
                dto.Status !=
                TeacherScheduleStatus.Closed
            )
            {
                throw new Exception(
                    "Invalid status");
            }

            schedule.Destination =
                dto.Destination.Trim();

            schedule.AvailableFrom =
                dto.AvailableFrom;

            schedule.AvailableTo =
                dto.AvailableTo;

            schedule.Status =
                dto.Status;

            await _teacherScheduleRepository
                .Update(schedule);

            await _teacherScheduleRepository
                .Save();

            return _mapper.Map<
                TeacherScheduleDto>(
                    schedule);
        }
        public async Task<StudentTripDto> UpdateTrip( int tripId, StudentTripDto dto)
        {
            if (
                dto.StartDate >
                dto.EndDate
            )
            {
                throw new Exception(
                    "Invalid date range");
            }

            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                .Value;

            var trip =
                await _studentTripRepository
                    .GetById(tripId);

            if (trip == null)
            {
                throw new Exception(
                    "Trip not found");
            }

            if (
                trip.StudentId !=
                userId
            )
            {
                throw new Exception(
                    "No permission");
            }

            if (
                trip.Status ==
                StudentTripStatus.Matched
            )
            {
                throw new Exception(
                    "Trip already matched");
            }

            var trips =
                await _studentTripRepository
                    .GetByStudentId(
                        userId);

            bool overlap =
                trips.Any(x =>
                    x.TripId != tripId
                    &&
                    x.StartDate <= dto.EndDate
                    &&
                    x.EndDate >= dto.StartDate);

            if (overlap)
            {
                throw new Exception(
                    "Trip dates overlap with another trip");
            }

            trip.Destination =
                dto.Destination.Trim();

            trip.SpecificLocation =
                dto.SpecificLocation;

            trip.PhoneNumber =
                dto.PhoneNumber;

            trip.StartDate =
                dto.StartDate;

            trip.EndDate =
                dto.EndDate;

            await _studentTripRepository
                .Update(trip);

            await _studentTripRepository
                .Save();

            return _mapper.Map<
                StudentTripDto>(
                    trip);
        }
        public async Task DeleteTeacherSchedule( int scheduleId)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                .Value;

            var schedule =
                await _teacherScheduleRepository
                    .GetById(scheduleId);

            if (schedule == null)
            {
                throw new Exception(
                    "Schedule not found");
            }

            if (
                schedule.TeacherId !=
                userId
            )
            {
                throw new Exception(
                    "No permission");
            }

            var requests =
                await _matchRequestRepository
                    .GetByScheduleId(
                        scheduleId);

            if (
                requests.Any(x =>
                    x.Status ==
                    MatchRequestStatus.Pending
                    ||
                    x.Status ==
                    MatchRequestStatus.Accepted)
            )
            {
                throw new Exception(
                    "Schedule has active requests");
            }

            await _teacherScheduleRepository
                .Delete(schedule);

            await _teacherScheduleRepository
                .Save();
        }
        public async Task DeleteTrip( int tripId)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                .Value;

            var trip =
                await _studentTripRepository
                    .GetById(tripId);

            if (trip == null)
            {
                throw new Exception(
                    "Trip not found");
            }

            if (
                trip.StudentId !=
                userId
            )
            {
                throw new Exception(
                    "No permission");
            }

            if (
                trip.Status ==
                StudentTripStatus.Matched
            )
            {
                throw new Exception(
                    "Matched trip cannot be deleted");
            }

            var requests =
    await _matchRequestRepository
        .GetByTripId(
            tripId);

            if (
                requests.Any(x =>
                    x.Status ==
                    MatchRequestStatus.Pending))
            {
                throw new Exception(
                    "Trip has pending requests");
            }

            await _studentTripRepository
                .Delete(trip);

            await _studentTripRepository
                .Save();
        }
        public async Task<List<MatchRequestDto>> GetRequestsByTrip( int tripId)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                .Value;

            var trip =
                await _studentTripRepository
                    .GetById(tripId);

            if (trip == null)
            {
                throw new Exception(
                    "Trip not found");
            }

            if (
                trip.StudentId !=
                userId
            )
            {
                throw new Exception(
                    "No permission");
            }

            var data =
                await _matchRequestRepository
                    .GetByTripId(
                        tripId);

            return _mapper.Map<
                List<MatchRequestDto>>(
                    data);
        }
        public async Task<List<MatchRequestDto>> GetRequestsBySchedule( int scheduleId)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                .Value;

            var schedule =
                await _teacherScheduleRepository
                    .GetById(
                        scheduleId);

            if (schedule == null)
            {
                throw new Exception(
                    "Schedule not found");
            }

            if (
                schedule.TeacherId !=
                userId
            )
            {
                throw new Exception(
                    "No permission");
            }

            var data =
                await _matchRequestRepository
                    .GetByScheduleId(
                        scheduleId);

            return _mapper.Map<
                List<MatchRequestDto>>(
                    data);
        }

        public async Task LinkClass(int requestId, int classId)
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email)).Value;

            var request = await _matchRequestRepository.GetById(requestId);
            if (request == null)
                throw new Exception("Request not found");

            if (request.Schedule?.TeacherId != userId)
                throw new Exception("No permission");

            if (request.Status != MatchRequestStatus.Accepted)
                throw new Exception("Request not accepted");

            var teacherClass = await _teacherClassRepository.GetByIdAsync(classId);
            if (teacherClass == null)
                throw new Exception("Class not found");

            request.ClassId = classId;
            teacherClass.ReservedStudentId = request.Trip!.StudentId;
            teacherClass.TripId = request.TripId;

            await _matchRequestRepository.Save();
        }

        public async Task<Dictionary<int, int>> GetMyReservedClassMap()
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email)).Value;

            // Map tripId → classId so each trip shows the correct class
            var rows = await _context.TeacherClasses
                .Where(c =>
                    c.TeacherProfile!.UserId == userId &&
                    c.ReservedStudentId.HasValue &&
                    c.TripId.HasValue)
                .Select(c => new { c.ClassId, c.TripId })
                .ToListAsync();

            return rows.ToDictionary(c => c.TripId!.Value, c => c.ClassId);
        }

        public async Task ReserveTripInClass(int tripId, int classId)
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email)).Value;

            var trip = await _studentTripRepository.GetById(tripId)
                ?? throw new Exception("Trip not found");

            var cls = await _teacherClassRepository.GetByIdAsync(classId)
                ?? throw new Exception("Class not found");

            if (cls.TeacherProfile?.UserId != userId)
                throw new Exception("No permission");

            if (cls.CurrentStudents >= cls.MaxStudents)
                throw new Exception("Class is full");

            // One teacher can only reserve one class per trip
            var existing = await _context.TeacherClasses
                .FirstOrDefaultAsync(c =>
                    c.TeacherProfile!.UserId == userId &&
                    c.TripId == tripId);
            if (existing != null)
                throw new Exception("You already created a class for this trip");

            cls.ReservedStudentId = trip.StudentId;
            cls.TripId = tripId;
            await _teacherClassRepository.UpdateAsync(cls);
            await _teacherClassRepository.SaveChangesAsync();
        }

        public async Task<List<TeacherClassDto>> GetReservedClassesForTrip(int tripId)
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email)).Value;

            var trip = await _studentTripRepository.GetById(tripId)
                ?? throw new Exception("Trip not found");

            if (trip.StudentId != userId)
                throw new Exception("No permission");

            // Return ALL classes reserved for this specific trip so student can browse and enroll
            var classes = await _context.TeacherClasses
                .Include(c => c.TeacherProfile).ThenInclude(c => c!.User)
                .Include(c => c.ClassScheduleDays)
                .Where(c => c.TripId == tripId && c.ReservedStudentId == userId && c.Status == 1)
                .OrderBy(c => c.StartDate)
                .ToListAsync();

            return _mapper.Map<List<TeacherClassDto>>(classes);
        }

        public async Task ChooseClassForTrip(int tripId, int classId)
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email)).Value;

            var trip = await _studentTripRepository.GetById(tripId)
                ?? throw new Exception("Trip not found");

            if (trip.StudentId != userId)
                throw new Exception("No permission");

            if (trip.Status != StudentTripStatus.FindingTeacher)
                throw new Exception("Trip already matched");

            var chosenClass = await _teacherClassRepository.GetByIdAsync(classId)
                ?? throw new Exception("Class not found");

            if (chosenClass.ReservedStudentId != userId)
                throw new Exception("No reservation for this class");

            // Enroll student in chosen class
            var enrollment = new ClassEnrollment
            {
                ClassId = classId,
                StudentId = userId,
                Status = 1,
                EnrolledDate = DateTime.UtcNow,
            };
            await _context.ClassEnrollments.AddAsync(enrollment);
            chosenClass.CurrentStudents += 1;
            chosenClass.ReservedStudentId = null;
            await _teacherClassRepository.UpdateAsync(chosenClass);

            // Release reservations from all other classes that reserved a spot for this student
            var otherClasses = await _teacherClassRepository.GetByReservedStudentIdAsync(userId);
            foreach (var cls in otherClasses)
            {
                if (cls.ClassId != classId)
                {
                    cls.ReservedStudentId = null;
                    await _teacherClassRepository.UpdateAsync(cls);
                }
            }

            // Mark trip as Matched
            trip.Status = StudentTripStatus.Matched;
            await _studentTripRepository.Update(trip);

            await _teacherClassRepository.SaveChangesAsync();
        }

        public async Task<List<TravelBookingAdminDto>> GetAllBookingsForAdmin(DateOnly? from, DateOnly? to)
        {
            var bookings = await _travelBookingRepository.GetAllConfirmed(from, to);

            return bookings.Select(b => new TravelBookingAdminDto
            {
                TravelBookingId = b.TravelBookingId,
                Destination     = b.Destination,
                SpecificLocation = b.Trip?.SpecificLocation,
                StartDate       = b.StartDate,
                EndDate         = b.EndDate,
                Status          = b.Status,
                CreatedAt       = b.CreatedAt,
                TeacherName     = b.Schedule?.Teacher?.Name ?? "",
                TeacherEmail    = b.Schedule?.Teacher?.Email,
                TeacherPhone    = b.Schedule?.Teacher?.PhoneNumber,
                TeacherCountry  = b.Schedule?.Teacher?.Country,
                StudentName     = b.Trip?.Student?.Name ?? "",
                StudentPhone    = b.Trip?.PhoneNumber,
                StudentEmail    = b.Trip?.Student?.Email,
                StudentCountry  = b.Trip?.Student?.Country,
            }).ToList();
        }

    }
}