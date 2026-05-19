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

        public TeacherAvailabilityServiceImpl(TeacherAvailabilityRepository availabilityRepository, UserContextUtil userContextUtil, UserRepository userRepository, TeacherProfileRepository teacherProfileRepository, IMapper mapper)
        {
            _availabilityRepository = availabilityRepository;
            _userRepository = userRepository;
            _userContext = userContextUtil;
            _teacherProfileRepository = teacherProfileRepository;
            _mapper = mapper;
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
        public async Task Create(TeacherAvailabilityDTO dto)
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var teacher = await _teacherProfileRepository.GetByUserId(userId);
            if (teacher == null || teacher.Status != common.Constant.StatusTeacherProfile.Approved)
            {
                throw new Exception("Teacher not approved");
            }

            if (dto.StartTime <= DateTime.UtcNow.AddMinutes(15))
            {
                throw new Exception("Schedule must be at least 15 minutes later");
            }

            if (dto.StartTime >= DateTime.UtcNow.AddDays(7))
            {
                throw new Exception("Schedule cannot exceed 7 days");
            }

            if (dto.StartTime >= dto.EndTime)
            {
                throw new Exception("Invalid time");
            }

            if (dto.StartTime.Date != dto.EndTime.Date)
            {
                throw new Exception("Schedule must be in one day");
            }

            var duration = dto.EndTime - dto.StartTime;
            if (duration.TotalMinutes < 30)
            {
                throw new Exception("Minimum duration is 30 minutes");
            }

            if (duration.TotalHours > 4)
            {
                throw new Exception("Maximum duration is 4 hours");
            }

            bool overlap = await _availabilityRepository.HasOverlapSchedule(userId, dto.StartTime, dto.EndTime);
            if (overlap)
            {
                throw new Exception("Schedule overlaps");
            }

            var availability = _mapper.Map<TeacherAvailability>(dto);
            availability.TeacherId = userId;
            availability.IsBooked = false;
            availability.CreatedDate = DateTime.UtcNow;

            await _availabilityRepository.Create(availability);
            await _availabilityRepository.Save();
        }

        /* 
         * teacher xoá lịch
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Delete(int availabilityId)
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var availability = await _availabilityRepository.GetById(availabilityId);
            if (availability == null)
            {
                throw new Exception("Availability not found");
            }

            if (availability.TeacherId != userId)
            {
                throw new UnauthorizedAccessException("You cannot delete this schedule");
            }

            if (availability.IsBooked)
            {
                throw new Exception("Schedule already booked");
            }

            if (availability.StartTime <= DateTime.UtcNow)
            {
                throw new Exception("Cannot delete started schedule");
            }

            await _availabilityRepository.Delete(availability);
            await _availabilityRepository.Save();
        }

        /* 
         * teacher sửa lịch
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Update(int id, TeacherAvailabilityDTO dto)
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var teacher = await _teacherProfileRepository.GetByUserId(userId);
            if (teacher == null || teacher.Status != common.Constant.StatusTeacherProfile.Approved)
            {
                throw new Exception("Teacher not approved");
            }

            var availability = await _availabilityRepository.GetById(id);
            if (availability == null)
            {
                throw new Exception("Schedule not found");
            }

            if (availability.TeacherId != userId)
            {
                throw new UnauthorizedAccessException("You cannot edit this schedule");
            }

            if (availability.IsBooked)
            {
                throw new Exception("Schedule already booked");
            }

            if (availability.StartTime <= DateTime.UtcNow)
            {
                throw new Exception("Cannot edit started schedule");
            }

            if (dto.StartTime <= DateTime.UtcNow.AddMinutes(15))
            {
                throw new Exception("Schedule must be at least 15 minutes later");
            }

            if (dto.StartTime >= DateTime.UtcNow.AddDays(7))
            {
                throw new Exception("Schedule cannot exceed 7 days");
            }

            if (dto.StartTime >= dto.EndTime)
            {
                throw new Exception("Invalid time");
            }

            if (dto.StartTime.Date != dto.EndTime.Date)
            {
                throw new Exception("Schedule must be in one day");
            }

            var duration = dto.EndTime - dto.StartTime;
            if (duration.TotalMinutes < 30)
            {
                throw new Exception("Minimum duration is 30 minutes");
            }

            if (duration.TotalHours > 4)
            {
                throw new Exception("Maximum duration is 4 hours");
            }

            bool overlap = await _availabilityRepository.HasOverlapSchedule(userId, dto.StartTime, dto.EndTime, id);
            if (overlap)
            {
                throw new Exception("Schedule overlaps");
            }

            availability.StartTime = dto.StartTime;
            availability.EndTime = dto.EndTime;

            await _availabilityRepository.Update(availability);
            await _availabilityRepository.Save();
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
        public async Task<List<TeacherAvailabilityDTO>> GetMySchedules()
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var data = await _availabilityRepository.GetTeacherSchedules(userId);
            return _mapper.Map<List<TeacherAvailabilityDTO>>(data);
        }
    }
}