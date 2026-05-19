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
        public async Task Create(ReviewDTO dto)
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            if (dto.Rating < 1 || dto.Rating > 5)
            {
                throw new Exception("Rating must be between 1 and 5");
            }

            if (string.IsNullOrWhiteSpace(dto.Comment))
            {
                throw new Exception("Comment is required");
            }

            if (dto.Comment.Length > 1000)
            {
                throw new Exception("Comment too long");
            }

            var booking = await _bookingRepository.GetById(dto.BookingId);
            if (booking == null)
            {
                throw new Exception("Booking not found");
            }

            if (booking.StudentId != userId)
            {
                throw new UnauthorizedAccessException("No permission");
            }

            if (booking.Status != common.Constant.StatusBooking.Completed)
            {
                throw new Exception("Booking not completed");
            }

            var exist = await _reviewRepository.GetByBookingId(dto.BookingId);
            if (exist != null)
            {
                throw new Exception("Already reviewed");
            }

            var review = new Review
            {
                BookingId = dto.BookingId,
                StudentId = userId,
                TeacherId = booking.TeacherId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedDate = DateTime.UtcNow
            };

            await _reviewRepository.Create(review);

            var teacher = await _teacherRepository.GetByUserId(booking.TeacherId);
            if (teacher != null)
            {
                var totalScore = teacher.RatingAverage * teacher.TotalReviews;
                teacher.TotalReviews++;
                teacher.RatingAverage = Math.Round((totalScore + dto.Rating) / teacher.TotalReviews, 2);

                await _teacherRepository.Update(teacher);
            }

            await _reviewRepository.Save();
        }

        /* 
         * lấy review theo teacher
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<ReviewDTO>> GetByTeacherId(int teacherId)
        {
            var teacher = await _teacherRepository.GetByUserId(teacherId);
            if (teacher == null)
            {
                throw new Exception("Teacher not found");
            }

            var data = await _reviewRepository.GetByTeacherId(teacherId);
            return _mapper.Map<List<ReviewDTO>>(data);
        }

        /* 
         * lấy review theo booking
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<ReviewDTO?> GetByBookingId(int bookingId)
        {
            var review = await _reviewRepository.GetByBookingId(bookingId);
            if (review == null)
            {
                return null;
            }

            return _mapper.Map<ReviewDTO>(review);
        }
    }
}