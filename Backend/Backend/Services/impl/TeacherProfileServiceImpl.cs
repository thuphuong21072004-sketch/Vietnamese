using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.DTO;
using Backend.Models;
using Backend.Repository;
using Stripe;

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

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!.Value;

            var teacher =
                await _teacherRepository
                    .GetByUserId(userId);

            if (teacher == null)
            {
                return null;
            }

            return _mapper.Map<TeacherProfileDTO>(
                teacher);
        }

        /* 
         * lưu teacher profile
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task CreateProfile(TeacherProfileDTO dto)
        {
            var email = _userContext.GetEmail();

            int userId = (await _userRepository
                .GetUserIdByEmail(email))!.Value;

            var teacher = await _teacherRepository
                .GetByUserId(userId);

            if (teacher != null)
            {
                throw new Exception(
                    "Teacher profile already exists");
            }

            teacher = _mapper.Map<TeacherProfile>(dto);

            teacher.UserId = userId;

            teacher.RatingAverage = 0;

            teacher.TotalReviews = 0;
            teacher.AdminNote = null;
            teacher.ApprovedBy = null;
            teacher.ApprovedPricePerHour = null;
            teacher.UpdatedDate = null;
            teacher.Status =
                common.Constant
                    .StatusTeacherProfile.Created;

            teacher.CreatedDate = DateTime.Now;

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

            int userId = (await _userRepository
                .GetUserIdByEmail(email))!.Value;

            var teacher = await _teacherRepository
                .GetByUserId(userId);

            if (teacher == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }

            if (teacher.UserId != userId)
            {
                throw new UnauthorizedAccessException(
                    "You cannot edit this profile");
            }

            if (
    teacher.Status ==
        common.Constant.StatusTeacherProfile.Submitted
    ||
    teacher.Status ==
        common.Constant.StatusTeacherProfile.ApprovedAdmin
    ||
    teacher.Status ==
        common.Constant.StatusTeacherProfile.ApprovedTeacher
    ||
    teacher.Status ==
        common.Constant.StatusTeacherProfile.Banned
)
            {
                throw new Exception(
                    "Profile cannot be edited");
            }

            teacher.IntroVideoUrl =
                dto.IntroVideoUrl;

            teacher.Specialty =
                dto.Specialty;

            teacher.ExperienceYears =
                dto.ExperienceYears;

            teacher.DesiredPricePerHour =
    dto.DesiredPricePerHour;

            teacher.EnglishCertificateUrl =
                dto.EnglishCertificateUrl;

            teacher.Description =
                dto.Description;
            

            if (
                teacher.Status ==
                common.Constant
                    .StatusTeacherProfile.RejectedAdmin || teacher.Status== common.Constant.StatusTeacherProfile.RejectedTeacher
            )
            {
                teacher.Status =
                    common.Constant
                        .StatusTeacherProfile.Created;
                teacher.AdminNote = null;
                teacher.ApprovedPricePerHour = null;
                teacher.ApprovedBy = null;
                teacher.CreatedDate = DateTime.Now;
                teacher.UpdatedDate = null;
            }

            await _teacherRepository.Save();
        }
        /*
         * nộp hồ sơ
         */
        public async Task SubmitProfile()
        {
            var email = _userContext.GetEmail();

            int userId = (await _userRepository
                .GetUserIdByEmail(email))!.Value;

            var teacher = await _teacherRepository
                .GetByUserId(userId);

            if (teacher == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }

            if (
                teacher.Status !=
                common.Constant
                    .StatusTeacherProfile.Created
            )
            {
                throw new Exception(
                    "Profile cannot be submitted");
            }
            teacher.Status =
                common.Constant
                    .StatusTeacherProfile.Submitted;
            string role= _userContext.GetRole();
            if (role == common.Constant.Role.Admin)
            {
                teacher.Status =
                common.Constant
                    .StatusTeacherProfile.ApprovedTeacher;
            }

            

            await _teacherRepository.Save();
        }
        /* 
         * admin duyệt 
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task ApprovedAdmin(int id, decimal approvedPrice, string? note)
        {
            if (!ValidateAdmin())
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission");
            }
            var teacher =
        await _teacherRepository.GetById(
            id);

            if (teacher == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }
            if (
       teacher.Status !=
       common.Constant
           .StatusTeacherProfile.Submitted
   )
            {
                throw new Exception(
                    "Only submitted profile can be approved");
            }
            teacher.Status =
        common.Constant
            .StatusTeacherProfile.ApprovedAdmin;

            teacher.ApprovedPricePerHour =
                approvedPrice;

            teacher.AdminNote =
                note;

            teacher.ApprovedBy =
                _userContext.GetEmail();

            teacher.UpdatedDate =
                DateTime.Now;

            await _teacherRepository.Save();

        }
        /* 
         * admin từ chối
         */
        public async Task RejectedAdmin( int id, string note)
        {


            if (!ValidateAdmin())
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission");
            }
            var teacher =
        await _teacherRepository.GetById(
            id);

            if (teacher == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }
            if (
       teacher.Status !=
       common.Constant
           .StatusTeacherProfile.Submitted
   )
            {
                throw new Exception(
                    "Only submitted profile can be approved");
            }

            teacher.Status =
        common.Constant
            .StatusTeacherProfile.RejectedAdmin;

            teacher.AdminNote =
                note;

            teacher.ApprovedBy =
                _userContext.GetEmail();

            teacher.UpdatedDate =
                DateTime.Now;

            await _teacherRepository.Save();
        }
        /*
         * giáo viên chấp nhận
         */
        public async Task ApprovedTeacher()
        {
            var email = _userContext.GetEmail();

            int userId = (await _userRepository
                .GetUserIdByEmail(email))!.Value;

            var teacher = await _teacherRepository
                .GetByUserId(userId);

            if (teacher == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }

            if (
                teacher.Status !=
                common.Constant
                    .StatusTeacherProfile.ApprovedAdmin
            )
            {
                throw new Exception(
                    "Profile is not waiting for confirmation");
            }

            teacher.Status =
                common.Constant
                    .StatusTeacherProfile.ApprovedTeacher;

            teacher.UpdatedDate = DateTime.Now;
            var user = await _userRepository.GetUserById(userId);
            var role = await _roleRepository.GetByName(
        common.Constant.Role.Teacher);
            user.RoleId = role.RoleId;

            await _teacherRepository.Save();
        }
        /*
         * giáo viên từ chối
         */
        public async Task RejectedTeacher()
        {
            var email = _userContext.GetEmail();

            int userId = (await _userRepository
                .GetUserIdByEmail(email))!.Value;

            var teacher = await _teacherRepository
                .GetByUserId(userId);

            if (teacher == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }

            if (
                teacher.Status !=
                common.Constant
                    .StatusTeacherProfile.ApprovedAdmin
            )
            {
                throw new Exception(
                    "Profile is not waiting for confirmation");
            }

            teacher.Status =
                common.Constant
                    .StatusTeacherProfile.RejectedTeacher;

            teacher.UpdatedDate =
                DateTime.Now;

            await _teacherRepository.Save();
        }
        /*
         * khóa vĩnh viễn giáo viên
         * O(1)
         */
        public async Task BanTeacher(int id, string reason)
        {
            if (!ValidateAdmin())
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission");
            }

            var teacher =
                await _teacherRepository.GetById(id);

            if (teacher == null)
            {
                throw new Exception(
                    "Teacher profile not found");
            }

            if (teacher.User == null)
            {
                throw new Exception(
                    "User not found");
            }

            teacher.Status =
                common.Constant
                    .StatusTeacherProfile.Banned;
            teacher.AdminNote =
        reason;

            teacher.ApprovedBy =
                _userContext.GetEmail();

            teacher.UpdatedDate =
                DateTime.Now;
            teacher.User.Status = 0;

            await _teacherRepository.Save();
        }
        /* 
         * danh sách giáo viên
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<TeacherProfileDTO>> GetAllTeachers( int? status)
        {
            if (!ValidateAdmin())
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission");
            }

            if (
                status.HasValue
                &&
                status != common.Constant.StatusTeacherProfile.Submitted
                &&
                status != common.Constant.StatusTeacherProfile.ApprovedAdmin
                &&
                status != common.Constant.StatusTeacherProfile.RejectedAdmin
                &&
                status != common.Constant.StatusTeacherProfile.ApprovedTeacher
                &&
                status != common.Constant.StatusTeacherProfile.RejectedTeacher
                &&
                status != common.Constant.StatusTeacherProfile.Banned
            )
            {
                throw new Exception(
                    "Invalid status");
            }

            var teachers =
                await _teacherRepository
                    .GetAllForAdmin(status);

            return teachers.Select(teacher =>
                new TeacherProfileDTO
                {
                    TeacherProfileId =
                        teacher.TeacherProfileId,

                    UserId =
                        teacher.UserId,

                    TeacherName =
                        teacher.User?.Name,

                    AvatarUrl =
                        teacher.User?.AvatarUrl,

                    Country =
                        teacher.User?.Country,

                    ExperienceYears =
                        teacher.ExperienceYears,

                    DesiredPricePerHour =
                        teacher.DesiredPricePerHour,

                    ApprovedPricePerHour =
                        teacher.ApprovedPricePerHour,

                    RatingAverage =
                        teacher.RatingAverage,

                    TotalReviews =
                        teacher.TotalReviews,

                    Status =
                        teacher.Status,

                    CreatedDate =
                        teacher.CreatedDate,

                    UpdatedDate =
                        teacher.UpdatedDate
                }
            ).ToList();
        }
        /* 
         * chi tiết giáo viên
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<TeacherProfileDTO?> GetDetailForAdmin( int id)
        {
            if (!ValidateAdmin())
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission");
            }

            var teacher =
                await _teacherRepository.GetDetail(id);

            if (teacher == null)
            {
                throw new Exception(
                    "Teacher not found");
            }

            return new TeacherProfileDTO
            {
                TeacherProfileId =
                    teacher.TeacherProfileId,

                UserId =
                    teacher.UserId,

                TeacherName =
                    teacher.User?.Name,

                AvatarUrl =
                    teacher.User?.AvatarUrl,

                Country =
                    teacher.User?.Country,

                IntroVideoUrl =
                    teacher.IntroVideoUrl,

                Specialty =
                    teacher.Specialty,

                ExperienceYears =
                    teacher.ExperienceYears,

                Description =
                    teacher.Description,

                EnglishCertificateUrl =
                    teacher.EnglishCertificateUrl,

                DesiredPricePerHour =
                    teacher.DesiredPricePerHour,

                ApprovedPricePerHour =
                    teacher.ApprovedPricePerHour,

                RatingAverage =
                    teacher.RatingAverage,

                TotalReviews =
                    teacher.TotalReviews,

                Status =
                    teacher.Status,

                AdminNote =
                    teacher.AdminNote,

                ApprovedBy =
                    teacher.ApprovedBy,

                CreatedDate =
                    teacher.CreatedDate,

                UpdatedDate =
                    teacher.UpdatedDate
            };
        }
        public async Task<TeacherProfileDTO?> GetDetailForStudent(int id)
        {
            var teacher =
                await _teacherRepository.GetDetail(id);

            if (teacher == null)
            {
                throw new Exception(
                    "Teacher not found");
            }

            if (
                teacher.Status !=
                common.Constant
                    .StatusTeacherProfile.ApprovedTeacher
            )
            {
                throw new Exception(
                    "Teacher not available");
            }

            return new TeacherProfileDTO
            {
                TeacherProfileId =
                    teacher.TeacherProfileId,

                UserId =
                    teacher.UserId,

                TeacherName =
                    teacher.User?.Name,

                AvatarUrl =
                    teacher.User?.AvatarUrl,

                Country =
                    teacher.User?.Country,

                IntroVideoUrl =
                    teacher.IntroVideoUrl,

                Specialty =
                    teacher.Specialty,

                ExperienceYears =
                    teacher.ExperienceYears,

                Description =
                    teacher.Description,

                EnglishCertificateUrl =
                    teacher.EnglishCertificateUrl,

                ApprovedPricePerHour =
                    teacher.ApprovedPricePerHour,

                RatingAverage =
                    teacher.RatingAverage,

                TotalReviews =
                    teacher.TotalReviews,
                Status= teacher.Status
            };
        }

    }
}