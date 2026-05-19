using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;

namespace Backend.Services.impl
{
    public class TeacherProfileServiceImpl : TeacherProfileService
    {
        private readonly TeacherProfileRepository _teacherRepository;
        private readonly UserContextUtil _userContext;
        private readonly UserRepository _userRepository;
        private readonly RoleRepository _roleRepository;
        private readonly IMapper _mapper;

        public TeacherProfileServiceImpl(TeacherProfileRepository teacherRepository, UserContextUtil userContextUtil, RoleRepository roleRepository, IMapper mapper, UserRepository userRepository)
        {
            _teacherRepository = teacherRepository;
            _userContext = userContextUtil;
            _roleRepository = roleRepository;
            _mapper = mapper;
            _userRepository = userRepository;
        }

        private bool ValidateAdmin()
        {
            string role = _userContext.GetRole();
            return role == common.Constant.Role.Admin;
        }

        /* 
         * lấy profile giáo viên hiện tại
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<TeacherProfileDTO?> GetMyProfile()
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;
            var teacher = await _teacherRepository.GetByUserId(userId);

            if (teacher == null) return null;

            return _mapper.Map<TeacherProfileDTO>(teacher);
        }

        /* 
         * lưu teacher profile
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task CreateProfile(TeacherProfileDTO dto)
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;
            var teacher = await _teacherRepository.GetByUserId(userId);

            if (teacher != null)
            {
                throw new Exception("Teacher profile already exists");
            }

            teacher = _mapper.Map<TeacherProfile>(dto);
            teacher.UserId = userId;
            teacher.RatingAverage = 0;
            teacher.TotalReviews = 0;
            teacher.Status = common.Constant.StatusTeacherProfile.Draft;

            await _teacherRepository.Create(teacher);
            await _teacherRepository.Save();
        }

        /* 
         * cập nhật hồ sơ cộng tác viên
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task UpdateProfile(TeacherProfileDTO dto)
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var teacher = await _teacherRepository.GetByUserId(userId);
            if (teacher == null)
            {
                throw new Exception("Teacher profile not found");
            }

            if (teacher.UserId != userId)
            {
                throw new UnauthorizedAccessException("You cannot edit this profile");
            }

            if (teacher.Status != common.Constant.StatusTeacherProfile.Draft && teacher.Status != common.Constant.StatusTeacherProfile.Rejected)
            {
                throw new Exception("Only draft or rejected profile can edit");
            }

            teacher.IntroVideoUrl = dto.IntroVideoUrl;
            teacher.Specialty = dto.Specialty;
            teacher.ExperienceYears = dto.ExperienceYears;
            teacher.PricePerHour = dto.PricePerHour;
            teacher.Description = dto.Description;

            await _teacherRepository.Save();
        }

        /* 
         * admin duyệt / từ chối hồ sơ
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task UpdateStatus(int id, int status)
        {
            var teacher = await _teacherRepository.GetById(id);
            if (teacher == null)
            {
                throw new Exception("Teacher profile not found");
            }

            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            if (status == common.Constant.StatusTeacherProfile.Pending)
            {
                if (teacher.UserId != userId)
                {
                    throw new UnauthorizedAccessException("You cannot submit this profile");
                }

                if (teacher.Status != common.Constant.StatusTeacherProfile.Draft && teacher.Status != common.Constant.StatusTeacherProfile.Rejected)
                {
                    throw new Exception("Only draft or rejected profile can submit");
                }

                teacher.Status = common.Constant.StatusTeacherProfile.Pending;
                await _teacherRepository.Save();
                return;
            }

            if (!ValidateAdmin())
            {
                throw new UnauthorizedAccessException("You do not have permission");
            }

            if (status != common.Constant.StatusTeacherProfile.Approved && status != common.Constant.StatusTeacherProfile.Rejected)
            {
                throw new Exception("Invalid status");
            }

            if (teacher.Status != common.Constant.StatusTeacherProfile.Pending)
            {
                throw new Exception("Only pending profile can review");
            }

            teacher.Status = (byte)status;

            if (status == common.Constant.StatusTeacherProfile.Approved)
            {
                if (teacher.User == null)
                {
                    throw new Exception("User not found");
                }

                var role = await _roleRepository.GetByName(common.Constant.Role.Moderator);
                teacher.User.RoleId = role.RoleId;
            }

            await _teacherRepository.Save();
        }

        /* 
         * danh sách giáo viên
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<TeacherProfileDTO>> GetAllTeachers(int? status)
        {
            if (!ValidateAdmin())
            {
                throw new UnauthorizedAccessException("You do not have permission");
            }

            if (status.HasValue && status != common.Constant.StatusTeacherProfile.Pending && status != common.Constant.StatusTeacherProfile.Approved && status != common.Constant.StatusTeacherProfile.Rejected)
            {
                throw new Exception("Invalid status");
            }

            var teachers = await _teacherRepository.GetAllForAdmin(status);
            return _mapper.Map<List<TeacherProfileDTO>>(teachers);
        }

        /* 
         * chi tiết giáo viên
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<TeacherProfileDTO?> GetDetail(int id)
        {
            var teacher = await _teacherRepository.GetDetail(id);
            if (teacher == null)
            {
                throw new Exception("Teacher not found");
            }

            if (teacher.Status == common.Constant.StatusTeacherProfile.Draft)
            {
                if (!ValidateAdmin())
                {
                    throw new Exception("Admin not approved");
                }
            }

            return _mapper.Map<TeacherProfileDTO>(teacher);
        }
    }
}