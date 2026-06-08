using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;
using static Backend.common.Constant;

namespace Backend.Services.impl
{
    public class ReviewServiceImpl : ReviewService
    {
        private readonly ReviewRepository _reviewRepository;
        private readonly BookingRepository _bookingRepository;
        private readonly TeacherProfileRepository _teacherRepository;
        private readonly UserRepository _userRepository;
        private readonly UserContextUtil _userContext;
        private readonly IMapper _mapper;
        private readonly ClassEnrollmentRepository
    _classEnrollmentRepository;

        public ReviewServiceImpl(ReviewRepository reviewRepository, BookingRepository bookingRepository, TeacherProfileRepository teacherRepository, UserRepository userRepository, UserContextUtil userContext, IMapper mapper, ClassEnrollmentRepository classEnrollmentRepository)
        {
            _reviewRepository = reviewRepository;
            _bookingRepository = bookingRepository;
            _teacherRepository = teacherRepository;
            _userRepository = userRepository;
            _userContext = userContext;
            _mapper = mapper;
            _classEnrollmentRepository = classEnrollmentRepository;
        }

        /* 
         * tạo review
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Create(ReviewDTO dto)
        {
            var email = _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                .Value;

            if (
                dto.Rating < 1 ||
                dto.Rating > 5
            )
            {
                throw new ArgumentException(
                    "Rating must be between 1 and 5");
            }

            if (string.IsNullOrWhiteSpace(dto.Comment))
            {
                throw new ArgumentException(
                    "Comment is required");
            }

            if (dto.Comment.Length > 1000)
            {
                throw new ArgumentException(
                    "Comment too long");
            }

            if (
                dto.RefName != RefName.Booking
                &&
                dto.RefName != RefName.Class
)
            {
                throw new ArgumentException(
                    "Invalid review type");
            }

            int instructorId;

            if (dto.RefName == RefName.Booking)
            {
                var booking =
                    await _bookingRepository
                        .GetById(dto.RefId);

                if (booking == null)
                {
                    throw new KeyNotFoundException(
                        "Booking not found");
                }

                if (booking.StudentId != userId)
                {
                    throw new UnauthorizedAccessException(
                        "No permission");
                }

                if (
                    booking.Status !=
                    StatusBooking.Completed
                )
                {
                    throw new InvalidOperationException(
                        "Lesson not completed");
                }

                instructorId =
                    booking.InstructorId;
            }
            else
            {
                // dto.RefId is classId
                var enrollment =
                    await _classEnrollmentRepository
                        .GetByClassAndStudent(dto.RefId, userId);

                if (enrollment == null)
                {
                    throw new KeyNotFoundException(
                        "Enrollment not found");
                }

                if (
                    enrollment.Status !=
                    StatusBooking.Completed
                )
                {
                    throw new InvalidOperationException(
                        "Course not completed");
                }

                instructorId =
                    enrollment.TeacherClass
                        .TeacherProfile!.UserId;
            }

            var exist =
                dto.RefName == RefName.Booking
                    ? await _reviewRepository.GetByRef(dto.RefName, dto.RefId)
                    : await _reviewRepository.GetByRefAndStudent(dto.RefName, dto.RefId, userId);

            if (exist != null)
            {
                throw new Exception(
                    "Already reviewed");
            }

            var review = new Review
            {
                RefId = dto.RefId,

                RefName = dto.RefName,

                StudentId = userId,

                InstructorId =
    instructorId,

                Rating = dto.Rating,

                Comment = dto.Comment,

                CreatedDate =
                    DateTime.UtcNow
            };

            await _reviewRepository
                .Create(review);

            var teacher =
    await _teacherRepository
        .GetByUserId(
            instructorId);

            if (teacher != null)
            {
                decimal totalScore =
                    teacher.RatingAverage *
                    teacher.TotalReviews;

                teacher.TotalReviews++;

                teacher.RatingAverage =
                    Math.Round(
                        (
                            totalScore +
                            dto.Rating
                        )
                        /
                        teacher.TotalReviews,
                        2);

                await _teacherRepository
                    .Update(teacher);
            }

            await _reviewRepository
                .Save();
        }

        /* 
         * lấy review theo teacher
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<ReviewDTO>> GetByTeacherId(int instructorId)
        {
            
            var teacher =
                await _teacherRepository
                    .GetByUserId(
                        instructorId);

            if (teacher == null)
            {
                throw new KeyNotFoundException(
                    "Teacher not found");
            }

            var data =
                await _reviewRepository
                    .GetByTeacherId(
                        instructorId);

            return _mapper.Map<
                List<ReviewDTO>>(data);
        }

        /* 
         * lấy review theo booking
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<List<ReviewDTO>> GetByClassId(int classId)
        {
            var reviews = await _reviewRepository.GetByClassId(classId);
            return _mapper.Map<List<ReviewDTO>>(reviews);
        }

        public async Task<ReviewDTO?> GetByRef(
    string refName,
    int refId)
        {
            if (
                refName != RefName.Booking &&
                refName != RefName.Class
            )
            {
                throw new ArgumentException("Invalid review type");
            }

            var email = _userContext.GetEmail();

            int userId =
                (await _userRepository.GetUserIdByEmail(email))!.Value;

            if (refName == RefName.Booking)
            {
                var booking = await _bookingRepository.GetById(refId);

                if (booking == null)
                {
                    throw new KeyNotFoundException("Booking not found");
                }

                if (
                    booking.StudentId != userId &&
                    booking.InstructorId != userId
                )
                {
                    throw new UnauthorizedAccessException("No permission");
                }

                var review = await _reviewRepository.GetByRef(refName, refId);

                return _mapper.Map<ReviewDTO>(review);
            }
            else
            {
                // refId is classId
                var enrollment =
                    await _classEnrollmentRepository
                        .GetByClassAndStudent(refId, userId);

                if (enrollment == null)
                {
                    throw new UnauthorizedAccessException("No permission");
                }

                var review =
                    await _reviewRepository
                        .GetByRefAndStudent(refName, refId, userId);

                return _mapper.Map<ReviewDTO>(review);
            }
        }
    }
}