using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;

namespace Backend.Services.impl
{
    public class TeacherAvailabilityServiceImpl : TeacherAvailabilityService
    {
        private readonly TeacherAvailabilityRepository _availabilityRepository;
        private readonly UserRepository _userRepository;
        private readonly UserContextUtil _userContext;
        private readonly TeacherProfileRepository _teacherProfileRepository;
        private readonly IMapper _mapper;
        private readonly BookingRepository _bookingRepository;

        public TeacherAvailabilityServiceImpl(TeacherAvailabilityRepository availabilityRepository, UserContextUtil userContextUtil, UserRepository userRepository, TeacherProfileRepository teacherProfileRepository, IMapper mapper, BookingRepository bookingRepository)
        {
            _availabilityRepository = availabilityRepository;
            _userRepository = userRepository;
            _userContext = userContextUtil;
            _teacherProfileRepository = teacherProfileRepository;
            _mapper = mapper;
            _bookingRepository = bookingRepository;
        }

        /* 
         * student xem tất cả lịch trống
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<TeacherAvailabilityDTO>> GetAvailableSchedules(DateOnly? date)
        {
            var data = await _availabilityRepository.GetAvailableSchedules(date);
            return _mapper.Map<List<TeacherAvailabilityDTO>>(data);
        }

        /* 
         * teacher tạo lịch
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Create(
    TeacherAvailabilityDTO dto)
        {
            /*
             * validate
             */
            if (dto.StartTime >= dto.EndTime)
            {
                throw new Exception(
                    "End time must be greater than start time");
            }

            /*
             * lấy email hiện tại
             */
            var email =
                _userContext.GetEmail();

            /*
             * tìm user id
             */
            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                    .Value;

            /*
             * check teacher profile
             */
            var teacherProfile =
                await _teacherProfileRepository
                    .GetByUserId(userId);

            if (teacherProfile == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }

            /*
             * check approved
             */
            if (teacherProfile.Status !=
                common.Constant.StatusTeacherProfile.Approved)
            {
                throw new Exception(
                    "Teacher profile is not approved");
            }

            /*
             * tạo lịch
             */
            var availability =
                new TeacherAvailability
                {
                    InstructorId = userId,

                    StartTime = dto.StartTime,

                    EndTime = dto.EndTime,

                    Status =
                       common.Constant
                            .StatusTeacherAvailability
                            .Available,

                    CreatedDate =
                        DateTime.Now
                };

            await _availabilityRepository
                .Create(availability);

            await _availabilityRepository
                .Save();
        }

        /* 
         * teacher xoá lịch
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Delete(int availabilityId)
        {
            var email = _userContext.GetEmail();

            int userId = (await _userRepository
                .GetUserIdByEmail(email))!.Value;

            var availability =
                await _availabilityRepository
                    .GetById(availabilityId);

            if (availability == null)
            {
                throw new Exception(
                    "Availability not found");
            }

            if (availability.InstructorId != userId)
            {
                throw new UnauthorizedAccessException(
                    "You cannot delete this schedule");
            }

            bool hasBooking =
    await HasBooking(availabilityId);

            if (hasBooking)
            {
                throw new Exception(
                    "Cannot delete booked schedule");
            }

            if (availability.StartTime <=
                DateTime.UtcNow)
            {
                throw new Exception(
                    "Cannot delete started schedule");
            }

            await _availabilityRepository
                .Delete(availability);

            await _availabilityRepository.Save();
        }

        /* 
         * teacher sửa lịch
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Update(
    int id,
    TeacherAvailabilityDTO dto)
        {
            var email = _userContext.GetEmail();

            int userId = (await _userRepository
                .GetUserIdByEmail(email))!.Value;

            var teacher =
                await _teacherProfileRepository
                    .GetByUserId(userId);

            if (teacher == null
                || teacher.Status !=
                common.Constant
                .StatusTeacherProfile.Approved)
            {
                throw new Exception(
                    "Teacher not approved");
            }

            var availability =
                await _availabilityRepository
                    .GetById(id);

            if (availability == null)
            {
                throw new Exception(
                    "Schedule not found");
            }

            if (availability.InstructorId != userId)
            {
                throw new UnauthorizedAccessException(
                    "You cannot edit this schedule");
            }

            bool hasBooking =
    await HasBooking(id);

            if (hasBooking)
            {
                throw new InvalidOperationException(
                    "Cannot edit booked schedule");
            }

            if (availability.StartTime <=
                DateTime.UtcNow)
            {
                throw new InvalidOperationException(
                    "Cannot edit started schedule");
            }

            if (dto.StartTime <=
                DateTime.UtcNow.AddMinutes(30))
            {
                throw new InvalidOperationException(
                    "Schedule must start at least 30 minutes from now.");
            }

            if (dto.StartTime >=
                DateTime.UtcNow.AddDays(30))
            {
                throw new InvalidOperationException(
                    "Schedule cannot be created more than 30 days in advance.");
            }

            if (dto.StartTime >= dto.EndTime)
            {
                throw new InvalidOperationException(
                    "End time must be after start time.");
            }

            if (dto.StartTime.Date !=
                dto.EndTime.Date)
            {
                throw new InvalidOperationException(
                    "Schedule must start and end on the same day.");
            }

            var duration =
                dto.EndTime - dto.StartTime;

            if (duration.TotalMinutes < 30)
            {
                throw new InvalidOperationException(
                    "Minimum schedule duration is 30 minutes.");
            }

            if (duration.TotalHours > 4)
            {
                throw new InvalidOperationException(
                    "Maximum schedule duration is 4 hours.");
            }

            bool overlap =
                await _availabilityRepository
                    .HasOverlapSchedule(
                        userId,
                        dto.StartTime,
                        dto.EndTime,
                        id);

            if (overlap)
            {
                throw new Exception(
                    "Schedule overlaps");
            }

            availability.StartTime =
                dto.StartTime;

            availability.EndTime =
                dto.EndTime;

            await _availabilityRepository
                .Save();
        }
        /* 
         * xem chi tiết lịch
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<TeacherAvailabilityDTO> GetDetail(int id)
        {
            var availability = await _availabilityRepository.GetById(id);
            if (availability == null)
            {
                throw new Exception("Schedule not found");
            }

            if (availability.EndTime <= DateTime.UtcNow)
            {
                throw new Exception("Schedule expired");
            }

            return _mapper.Map<TeacherAvailabilityDTO>(availability);
        }

        /* 
         * teacher xem lịch của mình
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<TeacherAvailabilityDTO>>
GetMySchedules(
    byte? status,
    DateOnly? date)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            var data =
                await _availabilityRepository
                    .GetTeacherSchedules(
                        userId,
                        status,
                        date);

            return _mapper.Map<
                List<TeacherAvailabilityDTO>>(data);
        }

        private async Task<bool>
HasBooking(int availabilityId)
        {
            var booking =
                await _bookingRepository
                    .GetActiveBookingByAvailabilityId(
                        availabilityId,
                        DateTime.UtcNow.AddYears(-1));

            return booking != null;
        }
    }
}