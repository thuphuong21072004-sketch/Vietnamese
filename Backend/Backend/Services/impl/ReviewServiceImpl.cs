using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;

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

        public ReviewServiceImpl(ReviewRepository reviewRepository, BookingRepository bookingRepository, TeacherProfileRepository teacherRepository, UserRepository userRepository, UserContextUtil userContext, IMapper mapper)
        {
            _reviewRepository = reviewRepository;
            _bookingRepository = bookingRepository;
            _teacherRepository = teacherRepository;
            _userRepository = userRepository;
            _userContext = userContext;
            _mapper = mapper;
        }

        /* 
         * tạo review
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Create(
    ReviewDTO dto)
        {
            /*
             * user hiện tại
             */
            var email = _userContext.GetEmail();

            int userId = (await _userRepository
                .GetUserIdByEmail(email))!.Value;

            /*
             * validate rating
             */
            if (dto.Rating < 1
                || dto.Rating > 5)
            {
                throw new ArgumentException(
                    "Rating must be between 1 and 5");
            }

            /*
             * validate comment
             */
            if (string.IsNullOrWhiteSpace(
                dto.Comment))
            {
                throw new ArgumentException(
                    "Comment is required");
            }

            if (dto.Comment.Length > 1000)
            {
                throw new ArgumentException(
                    "Comment too long");
            }

            /*
             * tìm booking
             */
            var booking =
                await _bookingRepository
                    .GetById(dto.BookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException(
                    "Booking not found");
            }

            /*
             * chỉ student mới review
             */
            if (booking.StudentId != userId)
            {
                throw new UnauthorizedAccessException(
                    "No permission");
            }

            /*
             * chỉ review lớp hoàn thành
             */
            if (booking.Status !=
                common.Constant
                .StatusBooking.Completed)
            {
                throw new InvalidOperationException(
                    "Class not completed");
            }

            /*
             * kiểm tra review tồn tại
             */
            var exist =
                await _reviewRepository
                    .GetByBookingId(
                        dto.BookingId);

            if (exist != null)
            {
                throw new Exception(
                    "Already reviewed");
            }

            /*
             * tạo review
             */
            var review = new Review
            {
                BookingId =
                    dto.BookingId,

                StudentId =
                    userId,

                InstructorId =
                    booking.InstructorId,

                Rating =
                    dto.Rating,

                Comment =
                    dto.Comment,

                CreatedDate =
                    DateTime.UtcNow
            };

            await _reviewRepository
                .Create(review);

            /*
             * cập nhật rating teacher
             */
            var teacher =
                await _teacherRepository
                    .GetByUserId(
                        booking.InstructorId);

            if (teacher != null)
            {
                decimal totalScore =
                    teacher.RatingAverage
                    * teacher.TotalReviews;

                teacher.TotalReviews++;

                teacher.RatingAverage =
                    Math.Round(
                        (
                            totalScore
                            + dto.Rating
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
        public async Task<List<ReviewDTO>>
GetByTeacherId(int instructorId)
        {
            /*
             * kiểm tra teacher
             */
            var teacher =
                await _teacherRepository
                    .GetByUserId(
                        instructorId);

            if (teacher == null)
            {
                throw new KeyNotFoundException(
                    "Teacher not found");
            }

            /*
             * lấy review
             */
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
        public async Task<ReviewDTO?>
GetByBookingId(int bookingId)
        {
            /*
             * tìm review
             */
            var review =
                await _reviewRepository
                    .GetByBookingId(
                        bookingId);

            if (review == null)
            {
                return null;
            }

            /*
             * tìm booking
             */
            var booking =
                await _bookingRepository
                    .GetById(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException(
                    "Booking not found");
            }

            /*
             * user hiện tại
             */
            var email = _userContext.GetEmail();

            int userId = (await _userRepository
                .GetUserIdByEmail(email))!.Value;

            /*
             * chỉ student hoặc instructor
             * mới được xem review
             */
            if (booking.StudentId != userId
                && booking.InstructorId != userId)
            {
                throw new UnauthorizedAccessException(
                    "No permission");
            }

            return _mapper.Map<ReviewDTO>(
                review);
        }
    }
}