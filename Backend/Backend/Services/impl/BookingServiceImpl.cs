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
        public async Task<BookingDTO>
        Create(int availabilityId)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            var availability =
                await _availabilityRepository
                    .GetById(availabilityId);

            if (availability == null)
            {
                throw new KeyNotFoundException(
                    "Schedule not found");
            }

            var teacher =
                await _teacherProfileRepository
                    .GetByUserId(
                        availability.InstructorId);

            if (
                teacher == null
                ||
                teacher.Status !=
               common.Constant
                    .StatusTeacherProfile
                    .Approved
            )
            {
                throw new InvalidOperationException(
                    "Teacher not approved");
            }

            /*
             * không tự đặt lịch của mình
             */
            if (
                availability.InstructorId ==
                userId
            )
            {
                throw new InvalidOperationException(
                    "Cannot book your own schedule");
            }

            /*
             * slot đã được đặt
             */
            if (
                availability.Status ==
               common.Constant
                    .StatusTeacherAvailability
                    .Booked
            )
            {
                throw new InvalidOperationException(
                    "Schedule already booked");
            }

            /*
             * phải đặt trước 30 phút
             */
            if (
                availability.StartTime <=
                DateTime.UtcNow.AddMinutes(30)
            )
            {
                throw new InvalidOperationException(
                    "Cannot book within 30 minutes");
            }

            /*
             * check trùng lịch học
             */
            bool overlap =
                await _bookingRepository
                    .HasOverlapBooking(
                        userId,
                        availability.StartTime,
                        availability.EndTime);

            if (overlap)
            {
                throw new InvalidOperationException(
                    "You already have another class at this time");
            }

            var booking =
                new Booking
                {
                    StudentId =
                        userId,

                    InstructorId =
                        availability.InstructorId,

                    AvailabilityId =
                        availability.AvailabilityId,

                    StartTime =
                        availability.StartTime,

                    EndTime =
                        availability.EndTime,

                    Status =
                       common.Constant
                            .StatusBooking
                            .PendingPayment,

                    CreatedDate =
                        DateTime.UtcNow
                };

            /*
             * giữ slot
             */
            availability.Status =
               common.Constant
                    .StatusTeacherAvailability
                    .Booked;

            await _bookingRepository
                .Create(booking);

            await _availabilityRepository
                .Update(availability);

            await _bookingRepository
                .Save();

            var createdBooking =
                await _bookingRepository
                    .GetById(
                        booking.BookingId);

            return _mapper.Map<BookingDTO>(
                createdBooking);
        }

        /*
         * booking của student
         */
        public async Task<List<BookingDTO>>
        GetMyBookings(
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
                await _bookingRepository
                    .GetByStudentId(
                        userId,
                        status,
                        date);

            foreach (var booking in data)
            {
                await AutoUpdateStatus(
                    booking);
            }

            return _mapper.Map<
                List<BookingDTO>>(data);
        }

        /*
         * booking của teacher
         */
        public async Task<List<BookingDTO>>
        GetTeacherBookings(
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
                await _bookingRepository
                    .GetByTeacherId(
                        userId,
                        status,
                        date);

            foreach (var booking in data)
            {
                await AutoUpdateStatus(
                    booking);
            }

            return _mapper.Map<
                List<BookingDTO>>(data);
        }

        /*
         * huỷ lịch
         */
        public async Task Cancel(int bookingId)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            var booking =
                await _bookingRepository
                    .GetById(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException(
                    "Booking not found");
            }

            /*
             * chỉ teacher hoặc student
             */
            if (
                booking.StudentId != userId
                &&
                booking.InstructorId != userId
            )
            {
                throw new UnauthorizedAccessException(
                    "No permission");
            }

            /*
             * đã hoàn thành
             */
            if (
                booking.Status ==
               common.Constant
                    .StatusBooking
                    .Completed
            )
            {
                throw new InvalidOperationException(
                    "Class completed");
            }

            /*
             * đã hủy
             */
            if (
                booking.Status ==
               common.Constant
                    .StatusBooking
                    .Cancelled
            )
            {
                throw new InvalidOperationException(
                    "Booking already cancelled");
            }

            /*
             * đang học
             */
            if (
                booking.Status ==
               common.Constant
                    .StatusBooking
                    .InProgress
            )
            {
                throw new InvalidOperationException(
                    "Class is in progress");
            }

            /*
             * student phải huỷ trước 1 ngày
             */
            if (
                booking.StudentId == userId
                &&
                booking.StartTime <=
                DateTime.UtcNow.AddDays(1)
            )
            {
                throw new InvalidOperationException(
                    "Must cancel at least 1 day before class");
            }

            booking.Status =
               common.Constant
                    .StatusBooking
                    .Cancelled;

            /*
             * mở lại slot
             */
            var availability =
                await _availabilityRepository
                    .GetById(
                        booking.AvailabilityId);

            if (availability != null)
            {
                availability.Status =
                   common.Constant
                        .StatusTeacherAvailability
                        .Available;

                await _availabilityRepository
                    .Update(availability);
            }

            await _bookingRepository
                .Update(booking);

            await _bookingRepository
                .Save();
        }

        /*
         * bắt đầu lớp học
         */
        public async Task Start(int bookingId)
        {
            var booking =
                await _bookingRepository
                    .GetById(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException(
                    "Booking not found");
            }

            /*
             * chỉ lớp confirmed mới start
             */
            if (
                booking.Status !=
               common.Constant
                    .StatusBooking
                    .Confirmed
            )
            {
                throw new InvalidOperationException(
                    "Class is not confirmed");
            }

            booking.Status =
               common.Constant
                    .StatusBooking
                    .InProgress;

            await _bookingRepository
                .Update(booking);

            await _bookingRepository
                .Save();
        }

        /*
         * hoàn thành lớp học
         */
        public async Task Complete(int bookingId)
        {
            var booking =
                await _bookingRepository
                    .GetById(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException(
                    "Booking not found");
            }

            if (
                booking.Status !=
               common.Constant
                    .StatusBooking
                    .InProgress
            )
            {
                throw new InvalidOperationException(
                    "Class is not in progress");
            }

            booking.Status =
               common.Constant
                    .StatusBooking
                    .Completed;

            booking.CompletedAt =
                DateTime.UtcNow;

            await _bookingRepository
                .Update(booking);

            await _bookingRepository
                .Save();
        }

        /*
         * chi tiết booking
         */
        public async Task<BookingDTO>
        GetDetail(int bookingId)
        {
            var booking =
                await _bookingRepository
                    .GetById(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException(
                    "Booking not found");
            }

            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            if (
                booking.StudentId != userId
                &&
                booking.InstructorId != userId
            )
            {
                throw new UnauthorizedAccessException(
                    "No permission");
            }

            await AutoUpdateStatus(
                booking);

            return _mapper.Map<BookingDTO>(
                booking);
        }

        /*
         * auto update status
         */

        private async Task AutoUpdateStatus(
    Booking booking)
        {
            var now = DateTime.Now;
            
            if (
                booking.Status ==
                common.Constant
                    .StatusBooking
                    .PendingPayment
            )
            {
                var payment =
                    await _paymentRepository
                        .GetByBookingId(
                            booking.BookingId);

                if (
    payment != null
    &&
    booking.Status ==
    common.Constant
        .StatusBooking
        .PendingPayment
    &&
    (
        payment.Status ==
        common.Constant
            .StatusPayment
            .Pending

        ||

        payment.Status ==
        common.Constant
            .StatusPayment
            .Failed
    )
    &&
    payment.CreatedDate
        .AddMinutes(5)
        <= DateTime.Now
)
                {
                    payment.Status =
                        common.Constant
                            .StatusPayment
                            .Expired;

                    booking.Status =
                        common.Constant
                            .StatusBooking
                            .Cancelled;

                    var availability =
                        await _availabilityRepository
                            .GetById(
                                booking.AvailabilityId);

                    if (availability != null)
                    {
                        availability.Status =
                            common.Constant
                                .StatusTeacherAvailability
                                .Available;

                        await _availabilityRepository
                            .Update(availability);
                    }

                    await _paymentRepository
                        .Update(payment);

                    await _bookingRepository
                        .Update(booking);

                    await _bookingRepository
                        .Save();
                }
            }
            /*
             * confirmed -> in progress
             */
            if (
                booking.Status ==
                common.Constant
                    .StatusBooking
                    .Confirmed
                &&
                booking.StartTime <= now
                &&
                booking.EndTime > now
            )
            {
                booking.Status =
                    common.Constant
                        .StatusBooking
                        .InProgress;

                await _bookingRepository
                    .Update(booking);

                await _bookingRepository
                    .Save();
            }

            /*
             * in progress -> completed
             */
            if (
                booking.Status ==
                common.Constant
                    .StatusBooking
                    .InProgress
                &&
                booking.EndTime <= now
            )
            {
                booking.Status =
                    common.Constant
                        .StatusBooking
                        .Completed;

                booking.CompletedAt = now;

                await _bookingRepository
                    .Update(booking);

                await _bookingRepository
                    .Save();
            }
        }
    }
}