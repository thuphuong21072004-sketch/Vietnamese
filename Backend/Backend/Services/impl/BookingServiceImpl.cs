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
        private readonly PaymentRepository _paymentRepository;

        public BookingServiceImpl(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            TeacherAvailabilityRepository availabilityRepository,
            TeacherProfileRepository teacherProfileRepository,
            UserContextUtil userContext,
            IMapper mapper,
            PaymentRepository paymentRepository)
        {
            _bookingRepository =
                bookingRepository;

            _availabilityRepository =
                availabilityRepository;

            _teacherProfileRepository =
                teacherProfileRepository;

            _userContext =
                userContext;

            _userRepository =
                userRepository;

            _mapper =
                mapper;
            _paymentRepository = paymentRepository;
        }

        /*
         * student đặt lịch
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

            var teacher = await _teacherProfileRepository.GetByUserId(availability.InstructorId);

            if (teacher == null || teacher.Status != common.Constant.StatusTeacherProfile.ApprovedTeacher)
            {
                throw new InvalidOperationException("Teacher not approved");
            }

            if (availability.InstructorId == userId)
            {
                throw new InvalidOperationException("Cannot book your own schedule");
            }

            if (availability.Status == common.Constant.StatusTeacherAvailability.Booked)
            {
                throw new InvalidOperationException("Schedule already booked");
            }

            if (availability.StartTime <= DateTime.Now.AddMinutes(30))
            {
                throw new InvalidOperationException("Cannot book within 30 minutes");
            }

            bool overlap = await _bookingRepository.HasOverlapBooking(
                userId,
                availability.StartTime,
                availability.EndTime
            );

            if (overlap)
            {
                throw new InvalidOperationException("You already have another class at this time");
            }

            double hours = (availability.EndTime - availability.StartTime).TotalHours;

            var booking = new Booking
            {
                StudentId = userId,
                InstructorId = availability.InstructorId,
                AvailabilityId = availability.AvailabilityId,
                StartTime = availability.StartTime,
                EndTime = availability.EndTime,
                TotalPrice = availability.PricePerHour,
                Status = common.Constant.StatusBooking.PendingPayment,
                CreatedDate = DateTime.Now
            };

            
            availability.Status = common.Constant.StatusTeacherAvailability.Booked;

            await _bookingRepository.Create(booking);
            await _availabilityRepository.Update(availability);
            await _bookingRepository.Save();

            var createdBooking = await _bookingRepository.GetById(booking.BookingId);

            return _mapper.Map<BookingDTO>(createdBooking);
        }

        /*
         * booking của student
         */
        public async Task<List<BookingDTO>> GetMyBookings(byte? status, DateOnly? date)
        {
            var email = _userContext.GetEmail();

            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var data = await _bookingRepository.GetByStudentId(userId, status, date);

            foreach (var booking in data)
            {
                await AutoUpdateStatus(booking);
            }

            return _mapper.Map<List<BookingDTO>>(data);
        }

        /*
         * booking của teacher
         */
        public async Task<List<BookingDTO>> GetTeacherBookings(byte? status, DateOnly? date)
        {
            var email = _userContext.GetEmail();

            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var data = await _bookingRepository.GetByTeacherId(userId, status, date);

            foreach (var booking in data)
            {
                await AutoUpdateStatus(booking);
            }

            return _mapper.Map<List<BookingDTO>>(data);
        }

        /*
         * huỷ lịch
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

            if (booking.StudentId != userId && booking.InstructorId != userId)
            {
                throw new UnauthorizedAccessException("No permission");
            }

            if (booking.Status == common.Constant.StatusBooking.Completed)
            {
                throw new InvalidOperationException("Class completed");
            }

            if (booking.Status == common.Constant.StatusBooking.Cancelled)
            {
                throw new InvalidOperationException("Booking already cancelled");
            }

            if (booking.Status == common.Constant.StatusBooking.InProgress)
            {
                throw new InvalidOperationException("Class is in progress");
            }

            if (booking.StudentId == userId && booking.StartTime <= DateTime.Now.AddDays(1))
            {
                throw new InvalidOperationException("Must cancel at least 1 day before class");
            }

            booking.Status = common.Constant.StatusBooking.Cancelled;

            var availability = await _availabilityRepository.GetById(booking.AvailabilityId);

            if (availability != null)
            {
                availability.Status = common.Constant.StatusTeacherAvailability.Available;
                await _availabilityRepository.Update(availability);
            }

            await _bookingRepository.Update(booking);
            await _bookingRepository.Save();
        }

        /*
         * chi tiết booking
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

            if (booking.StudentId != userId && booking.InstructorId != userId)
            {
                throw new UnauthorizedAccessException("No permission");
            }

            await AutoUpdateStatus(booking);

            return _mapper.Map<BookingDTO>(booking);
        }

        /*
         * auto update status
         */

        private async Task AutoUpdateStatus(Booking booking)
        {
            var now = DateTime.Now;

            // Hết hạn thanh toán
            if (booking.Status == common.Constant.StatusBooking.PendingPayment)
            {
                var payment = await _paymentRepository.GetByRef(common.Constant.RefName.Booking,booking.BookingId);

                if (payment != null &&
                    (payment.Status == common.Constant.StatusPayment.Pending ||
                     payment.Status == common.Constant.StatusPayment.Failed) &&
                    payment.CreatedDate.AddMinutes(15) <= now)
                {
                    payment.Status = common.Constant.StatusPayment.Expired;
                    booking.Status = common.Constant.StatusBooking.Cancelled;

                    var availability = await _availabilityRepository.GetById(booking.AvailabilityId);

                    if (availability != null)
                    {
                        availability.Status = common.Constant.StatusTeacherAvailability.Available;
                        await _availabilityRepository.Update(availability);
                    }

                    await _paymentRepository.Update(payment);
                    await _bookingRepository.Update(booking);
                    await _bookingRepository.Save();

                    return;
                }
            }

            // Đang học
            if (booking.Status == common.Constant.StatusBooking.Confirmed &&
                booking.StartTime <= now &&
                booking.EndTime > now)
            {
                booking.Status = common.Constant.StatusBooking.InProgress;

                await _bookingRepository.Update(booking);
                await _bookingRepository.Save();

                return;
            }

            // Hoàn thành
            if ((booking.Status == common.Constant.StatusBooking.Confirmed ||
                 booking.Status == common.Constant.StatusBooking.InProgress) &&
                booking.EndTime <= now)
            {
                booking.Status = common.Constant.StatusBooking.Completed;
                booking.CompletedAt = now;

                await _bookingRepository.Update(booking);
                await _bookingRepository.Save();
            }
        }

        public async Task<object> GetMyStatistics(int month, int year)
        {
            var email = _userContext.GetEmail();

            int studentId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var bookings = await _bookingRepository.GetByStudentId(studentId, null, null);

            bookings = bookings.Where(x => x.StartTime.Month == month && x.StartTime.Year == year).ToList();

            return new
            {
                TotalBookings = bookings.Count,
                PendingPaymentBookings = bookings.Count(x => x.Status == common.Constant.StatusBooking.PendingPayment),
                ConfirmedBookings = bookings.Count(x => x.Status == common.Constant.StatusBooking.Confirmed),
                InProgressBookings = bookings.Count(x => x.Status == common.Constant.StatusBooking.InProgress),
                CompletedBookings = bookings.Count(x => x.Status == common.Constant.StatusBooking.Completed),
                CancelledBookings = bookings.Count(x => x.Status == common.Constant.StatusBooking.Cancelled),
                RefundedBookings = bookings.Count(x => x.Status == common.Constant.StatusBooking.Refunded),
                TotalSpent = bookings.Sum(x => x.TotalPrice)
            };
        }

        public async Task<object> GetTeacherStatistics(int month, int year)
        {
            var email = _userContext.GetEmail();

            int teacherId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var bookings = await _bookingRepository.GetByTeacherId(teacherId, null, null);

            bookings = bookings.Where(x => x.StartTime.Month == month && x.StartTime.Year == year).ToList();

            return new
            {
                TotalBookings = bookings.Count,
                PendingPaymentBookings = bookings.Count(x => x.Status == common.Constant.StatusBooking.PendingPayment),
                ConfirmedBookings = bookings.Count(x => x.Status == common.Constant.StatusBooking.Confirmed),
                InProgressBookings = bookings.Count(x => x.Status == common.Constant.StatusBooking.InProgress),
                CompletedBookings = bookings.Count(x => x.Status == common.Constant.StatusBooking.Completed),
                CancelledBookings = bookings.Count(x => x.Status == common.Constant.StatusBooking.Cancelled),
                RefundedBookings = bookings.Count(x => x.Status == common.Constant.StatusBooking.Refunded),
                TotalStudents = bookings.Select(x => x.StudentId).Distinct().Count(),
                TotalRevenue = bookings.Sum(x => x.TotalPrice)
            };
        }

        public async Task<object> GetTopTeachers(int month, int year)
        {
            var bookings = await _bookingRepository.GetBookingsByMonth(month, year);

            return bookings
                .GroupBy(x => new { x.InstructorId, x.Instructor.Name })
                .Select(g => new
                {
                    TeacherId = g.Key.InstructorId,
                    TeacherName = g.Key.Name,
                    TotalBookings = g.Count(),
                    CompletedBookings = g.Count(x => x.Status == common.Constant.StatusBooking.Completed),
                    Revenue = g.Where(x => x.Status == common.Constant.StatusBooking.Completed).Sum(x => x.TotalPrice)
                })
                .OrderByDescending(x => x.CompletedBookings)
                .ThenByDescending(x => x.Revenue)
                .Take(5)
                .ToList();
        }

        public async Task<object> GetTopStudents(int month, int year)
        {
            var bookings = await _bookingRepository.GetBookingsByMonth(month, year);

            return bookings
                .GroupBy(x => new { x.StudentId, x.Student.Name })
                .Select(g => new
                {
                    StudentId = g.Key.StudentId,
                    StudentName = g.Key.Name,
                    TotalBookings = g.Count(),
                    CompletedBookings = g.Count(x => x.Status == common.Constant.StatusBooking.Completed),
                    TotalSpent = g.Where(x => x.Status == common.Constant.StatusBooking.Completed).Sum(x => x.TotalPrice)
                })
                .OrderByDescending(x => x.CompletedBookings)
                .ThenByDescending(x => x.TotalSpent)
                .Take(5)
                .ToList();
        }
    }
}