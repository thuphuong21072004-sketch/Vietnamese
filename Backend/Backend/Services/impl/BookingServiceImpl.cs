using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;

namespace Backend.Services.impl
{
    public class BookingServiceImpl : BookingService
    {
        private readonly BookingRepository _bookingRepository;
        private readonly TeacherAvailabilityRepository _availabilityRepository;
        private readonly TeacherProfileRepository _teacherProfileRepository;
        private readonly UserRepository _userRepository;
        private readonly UserContextUtil _userContext;
        private readonly IMapper _mapper;

        public BookingServiceImpl(BookingRepository bookingRepository, UserRepository userRepository, TeacherAvailabilityRepository availabilityRepository, TeacherProfileRepository teacherProfileRepository, UserContextUtil userContext, IMapper mapper)
        {
            _bookingRepository = bookingRepository;
            _availabilityRepository = availabilityRepository;
            _teacherProfileRepository = teacherProfileRepository;
            _userContext = userContext;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        /* 
         * student đặt lịch
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<BookingDTO> Create(int availabilityId)
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var availability = await _availabilityRepository.GetById(availabilityId);
            if (availability == null)
            {
                throw new KeyNotFoundException("Schedule not found");
            }

            var teacher = await _teacherProfileRepository.GetByUserId(availability.TeacherId);
            if (teacher == null || teacher.Status != common.Constant.StatusTeacherProfile.Approved)
            {
                throw new InvalidOperationException("Teacher not approved");
            }

            if (availability.TeacherId == userId)
            {
                throw new InvalidOperationException("Cannot book your own schedule");
            }

            if (availability.IsBooked)
            {
                throw new InvalidOperationException("Schedule already booked");
            }

            if (availability.StartTime <= DateTime.UtcNow.AddMinutes(30))
            {
                throw new InvalidOperationException("Cannot book schedule starting within 30 minutes.");
            }

            var holdWindow = DateTime.UtcNow.AddMinutes(-15);
            var activeBooking = await _bookingRepository.GetActiveBookingByAvailabilityId(availabilityId, holdWindow);
            if (activeBooking != null)
            {
                throw new InvalidOperationException("Schedule already reserved or booked");
            }

            var staleBookings = await _bookingRepository.GetPendingBookingsBefore(availabilityId, holdWindow);
            foreach (var staleBooking in staleBookings)
            {
                staleBooking.Status = common.Constant.StatusBooking.Cancelled;
                await _bookingRepository.Update(staleBooking);
            }

            bool overlap = await _bookingRepository.HasOverlapBooking(userId, availability.StartTime, availability.EndTime);
            if (overlap)
            {
                throw new InvalidOperationException("You already have another class at this time");
            }

            var booking = new Booking
            {
                StudentId = userId,
                TeacherId = availability.TeacherId,
                AvailabilityId = availability.AvailabilityId,
                StartTime = availability.StartTime,
                EndTime = availability.EndTime,
                Status = common.Constant.StatusBooking.Pending,
                CreatedDate = DateTime.UtcNow
            };

            await _bookingRepository.Create(booking);
            await _bookingRepository.Save();

            var createdBooking = await _bookingRepository.GetById(booking.BookingId);
            if (createdBooking == null)
            {
                throw new InvalidOperationException("Failed to retrieve created booking");
            }

            return _mapper.Map<BookingDTO>(createdBooking);
        }

        /* 
         * booking của student
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<BookingDTO>> GetMyBookings()
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var data = await _bookingRepository.GetByStudentId(userId);
            return _mapper.Map<List<BookingDTO>>(data);
        }

        /* 
         * booking của teacher
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<BookingDTO>> GetTeacherBookings()
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var data = await _bookingRepository.GetByTeacherId(userId);
            return _mapper.Map<List<BookingDTO>>(data);
        }

        /* 
         * huỷ lịch
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Cancel(int bookingId)
        {
            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var booking = await _bookingRepository.GetById(bookingId);
            if (booking == null)
            {
                throw new KeyNotFoundException("Booking not found");
            }

            if (booking.StudentId != userId && booking.TeacherId != userId)
            {
                throw new UnauthorizedAccessException("No permission");
            }

            if (booking.StartTime <= DateTime.UtcNow)
            {
                throw new InvalidOperationException("Class has already started");
            }

            if (booking.Status == common.Constant.StatusBooking.Cancelled)
            {
                throw new InvalidOperationException("Booking already cancelled");
            }


            if (booking.StudentId == userId && booking.StartTime <= DateTime.UtcNow.AddDays(1))
            {
                throw new InvalidOperationException("Must cancel at least 1 day before class");
            }

            booking.Status = common.Constant.StatusBooking.Cancelled;

            var availability = await _availabilityRepository.GetById(booking.AvailabilityId);
            if (availability != null)
            {
                availability.IsBooked = false;
                await _availabilityRepository.Update(availability);
            }

            await _bookingRepository.Update(booking);
            await _bookingRepository.Save();
        }

        /* 
         * chi tiết booking
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<BookingDTO> GetDetail(int bookingId)
        {
            var booking = await _bookingRepository.GetById(bookingId);
            if (booking == null)
            {
                throw new KeyNotFoundException("Booking not found");
            }

            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            if (booking.StudentId != userId && booking.TeacherId != userId)
            {
                throw new UnauthorizedAccessException("No permission");
            }

            return _mapper.Map<BookingDTO>(booking);
        }

    }
}