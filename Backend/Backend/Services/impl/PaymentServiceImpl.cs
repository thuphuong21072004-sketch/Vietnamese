using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;
using Microsoft.AspNetCore.Http;

namespace Backend.Services.impl
{
    public class PaymentServiceImpl : PaymentService
    {
        private readonly PaymentRepository _paymentRepository;
        private readonly BookingRepository _bookingRepository;
        private readonly TeacherAvailabilityRepository _availabilityRepository;
        private readonly UserRepository _userRepository;
        private readonly UserContextUtil _userContext;
        private readonly IMapper _mapper;
        
        private readonly StripeService _stripeService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        private readonly ExchangeRateService _exchangeRateService;
        public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            TeacherAvailabilityRepository availabilityRepository,
            UserRepository userRepository,
            UserContextUtil userContext,
            IMapper mapper,
           StripeService stripeService, ExchangeRateService exchangeRateService,
            IHttpContextAccessor httpContextAccessor)
        {
            _paymentRepository =
                paymentRepository;

            _bookingRepository =
                bookingRepository;

            _availabilityRepository =
                availabilityRepository;

            _userRepository =
                userRepository;

            _userContext =
                userContext;

            _mapper =
                mapper;
            _stripeService = stripeService;

            _httpContextAccessor =
                httpContextAccessor;
            _exchangeRateService = exchangeRateService;
        }

        /*
         * tạo payment
         */
        public async Task<PaymentDTO> Create(PaymentDTO dto)
        {
            if (dto.Amount <= 0)
            {
                throw new ArgumentException(
                    "Invalid amount");
            }

            var booking =
                await _bookingRepository
                    .GetById(dto.BookingId);

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

            if (booking.StudentId != userId)
            {
                throw new UnauthorizedAccessException(
                    "No permission");
            }

            if (
                booking.Status ==
               common.Constant
                    .StatusBooking
                    .Cancelled
            )
            {
                throw new InvalidOperationException(
                    "Booking cancelled");
            }

            if (
                booking.Status !=
               common.Constant
                    .StatusBooking
                    .PendingPayment
            )
            {
                throw new InvalidOperationException(
                    "Booking is not waiting for payment");
            }

            var exist =
                await _paymentRepository
                    .GetByBookingId(
                        dto.BookingId);

            if (exist != null)
            {
               
                if (
                    exist.Status ==
                   common.Constant
                        .StatusPayment
                        .Pending
                    &&
                    exist.CreatedDate
                        .AddMinutes(15)
                        > DateTime.Now
                )
                {
                    throw new InvalidOperationException(
                        "Payment already exists");
                }

                if (
                    exist.Status ==
                   common.Constant
                        .StatusPayment
                        .Pending
                    &&
                    exist.CreatedDate
                        .AddMinutes(15)
                        <= DateTime.Now
                )
                {
                    exist.Status =
                       common.Constant
                            .StatusPayment
                            .Expired;

                    await _paymentRepository
                        .Update(exist);
                }
            }

            var payment =
                _mapper.Map<Payment>(dto);

            payment.Status =
               common.Constant
                    .StatusPayment
                    .Pending;

            payment.CreatedDate =
                DateTime.Now;

            payment.PaidAt = null;

            await _paymentRepository
                .Create(payment);

            await _paymentRepository
                .Save();

            return _mapper.Map<PaymentDTO>(
                payment);
        }

        /*
         * payment success
         */
        public async Task Success(
    int paymentId,
    string transactionCode)
        {
            Console.WriteLine(
                $"ENTER SUCCESS: {paymentId}");

            if (
                string.IsNullOrWhiteSpace(
                    transactionCode)
            )
            {
                throw new ArgumentException(
                    "Transaction code required");
            }

            var payment =
                await _paymentRepository
                    .GetById(paymentId);

            Console.WriteLine(
                $"Payment Status Before = {payment?.Status}");

            if (payment == null)
            {
                throw new KeyNotFoundException(
                    "Payment not found");
            }

            if (
                payment.Status ==
               common.Constant
                    .StatusPayment
                    .Success
            )
            {
                throw new InvalidOperationException(
                    "Payment already succeeded");
            }

            if (
                payment.Status ==
               common.Constant
                    .StatusPayment
                    .Failed
            )
            {
                throw new InvalidOperationException(
                    "Payment already failed");
            }

            if (
                payment.Status ==
               common.Constant
                    .StatusPayment
                    .Expired
            )
            {
                Console.WriteLine(
                    $"PAYMENT EXPIRED BEFORE SUCCESS");

                throw new InvalidOperationException(
                    "Payment expired");
            }

            payment.Status =
               common.Constant
                    .StatusPayment
                    .Success;

            payment.TransactionCode =
                transactionCode;

            payment.PaidAt =
                DateTime.Now;

            var booking =
                await _bookingRepository
                    .GetById(
                        payment.BookingId);

            if (booking != null)
            {
                booking.Status =
                   common.Constant
                        .StatusBooking
                        .Confirmed;

                await _bookingRepository
                    .Update(booking);
            }

            await _paymentRepository
                .Update(payment);

            await _paymentRepository
                .Save();

            Console.WriteLine(
                $"PAYMENT SUCCESS SAVED");
        }

        /*
         * payment failed
         */
        public async Task Failed(int paymentId)
        {
            var payment =
                await _paymentRepository
                    .GetById(paymentId);

            if (payment == null)
            {
                throw new KeyNotFoundException(
                    "Payment not found");
            }

            if (
                payment.Status ==
               common.Constant
                    .StatusPayment
                    .Success
            )
            {
                throw new InvalidOperationException(
                    "Payment already succeeded");
            }

            if (
                payment.Status ==
               common.Constant
                    .StatusPayment
                    .Failed
            )
            {
                throw new InvalidOperationException(
                    "Payment already failed");
            }

            payment.Status =
               common.Constant
                    .StatusPayment
                    .Failed;

            var booking =
                await _bookingRepository
                    .GetById(
                        payment.BookingId);

            if (booking != null)
            {
                booking.Status =
                   common.Constant
                        .StatusBooking
                        .PendingPayment;

                await _bookingRepository
                    .Update(booking);
            }

            await _paymentRepository
                .Update(payment);

            await _paymentRepository
                .Save();
        }

        /*
         * payment theo booking
         */
        public async Task<PaymentDTO?> GetByBooking(int bookingId)
        {
            var payment =
                await _paymentRepository
                    .GetByBookingId(
                        bookingId);

            if (payment == null)
            {
                return null;
            }

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

            // Tạm thời tắt auto expire để test Stripe

            /*
            if (
                payment.Status ==
                common.Constant
                    .StatusPayment
                    .Pending
                &&
                payment.CreatedDate
                    .AddMinutes(15)
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

                await _bookingRepository
                    .Update(booking);

                await _paymentRepository
                    .Update(payment);

                await _paymentRepository
                    .Save();
            }
            */

            return _mapper.Map<PaymentDTO>(
                payment);
        }

        /*
         * tạo url vnpay
         */

        public async Task<string> CreateStripeUrl(
        int paymentId,
        string currency)
        {
            var payment =
                await _paymentRepository
                    .GetById(paymentId);

            if (payment == null)
            {
                throw new Exception(
                    "Payment not found");
            }

            decimal finalAmount =
                payment.Amount;

            if (
                currency.ToUpper() != "USD"
            )
            {
                var allRates =
                    await _exchangeRateService
                        .GetAllCurrencies(
                            payment.Amount);

                if (
                    allRates.ContainsKey(
                        currency.ToUpper())
                )
                {
                    finalAmount =
                        allRates[
                            currency.ToUpper()];
                }
            }

            return _stripeService
                .CreateCheckoutSession(
                    payment.PaymentId,
                    finalAmount,
                    currency);
        }

        public async Task<object> GetMyPaymentHistory(int month, int year, int page, int pageSize)
        {
            var email = _userContext.GetEmail();

            int studentId = (await _userRepository.GetUserIdByEmail(email)).Value;

            var payments = await _paymentRepository.GetByMonth(month, year);

            var query = payments
                .Where(x => x.Booking != null && x.Booking.StudentId == studentId && (x.Status == common.Constant.StatusPayment.Success || x.Status == common.Constant.StatusPayment.Refunded))
                .OrderByDescending(x => x.Booking.StartTime);

            int total = query.Count();

            var data = query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new
                {
                    x.PaymentId,
                    x.BookingId,
                    TeacherId = x.Booking.InstructorId,
                    TeacherName = x.Booking.Instructor.Name,
                    StudyDate = x.Booking.StartTime.ToString("dd/MM/yyyy"),
                    StartTime = x.Booking.StartTime,
                    EndTime = x.Booking.EndTime,
                    Hours = Math.Round((decimal)(x.Booking.EndTime - x.Booking.StartTime).TotalHours, 2),
                    Amount = x.Amount,
                    BookingStatus = x.Booking.Status,
                    PaymentStatus = x.Status
                })
                .ToList();

            return new
            {
                Total = total,
                Page = page,
                PageSize = pageSize,
                Data = data
            };
        }
        public async Task<object> GetMyStatistics(int month, int year)
        {
            var email = _userContext.GetEmail();

            int studentId =
                (await _userRepository.GetUserIdByEmail(email))!.Value;

            var bookings =
                await _bookingRepository.GetByStudentId(studentId, null, null);

            bookings = bookings
                .Where(x => x.StartTime.Month == month &&
                            x.StartTime.Year == year)
                .ToList();

            var payments =
                await _paymentRepository.GetByMonth(month, year);

            payments = payments
                .Where(x => x.Booking != null &&
                            x.Booking.StudentId == studentId)
                .ToList();

            return new
            {
                TotalBookings = bookings.Count(),

                CompletedBookings =
                    bookings.Count(x =>
                        x.Status == common.Constant.StatusBooking.Completed),

                UpcomingBookings =
                    bookings.Count(x =>
                        x.Status == common.Constant.StatusBooking.Confirmed ||
                        x.Status == common.Constant.StatusBooking.InProgress),

                CancelledBookings =
                    bookings.Count(x =>
                        x.Status == common.Constant.StatusBooking.Cancelled),

                TotalPaid =
                    payments.Where(x =>
                        x.Status == common.Constant.StatusPayment.Success)
                    .Sum(x => x.Amount),

                RefundedAmount =
                    payments.Where(x =>
                        x.Status == common.Constant.StatusPayment.Refunded)
                    .Sum(x => x.Amount),

                PendingRefundAmount =
                    payments.Where(x =>
                        x.Status == common.Constant.StatusPayment.Success &&
                        x.Booking.Status == common.Constant.StatusBooking.Cancelled)
                    .Sum(x => x.Amount)
            };
        }

        public async Task<object> GetMySalaryStatistics(int month, int year)
        {
            var email = _userContext.GetEmail();

            int teacherId = (await _userRepository.GetUserIdByEmail(email)).Value;

            var bookings = await _bookingRepository.GetByTeacherId(teacherId, null, null);

            bookings = bookings
                .Where(x => x.StartTime.Month == month && x.StartTime.Year == year && x.Status == common.Constant.StatusBooking.Completed)
                .ToList();

            decimal totalHours = bookings.Sum(x => (decimal)(x.EndTime - x.StartTime).TotalHours);

            decimal salaryAmount = bookings.Sum(x => x.TotalPrice);

            return new
            {
                TotalHours = Math.Round(totalHours, 2),
                SalaryAmount = salaryAmount
            };
        }
        public async Task<object> GetMySalaryHistory(int month, int year, int page, int pageSize)
        {
            var email = _userContext.GetEmail();

            int teacherId = (await _userRepository.GetUserIdByEmail(email)).Value;

            var query = (await _bookingRepository.GetByTeacherId(teacherId, null, null))
                .Where(x => x.StartTime.Month == month && x.StartTime.Year == year && x.Status == common.Constant.StatusBooking.Completed)
                .OrderByDescending(x => x.StartTime);

            int total = query.Count();

            var data = query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new
                {
                    x.BookingId,
                    StudentId = x.StudentId,
                    StudentName = x.Student.Name,
                    StudyDate = x.StartTime.ToString("dd/MM/yyyy"),
                    x.StartTime,
                    x.EndTime,
                    Hours = Math.Round((decimal)(x.EndTime - x.StartTime).TotalHours, 2),
                    SalaryAmount = x.TotalPrice
                })
                .ToList();

            return new
            {
                Total = total,
                Page = page,
                PageSize = pageSize,
                Data = data
            };
        }

        public async Task<object> GetAdminFinanceOverview(int month, int year)
        {
            var payments = await _paymentRepository.GetByMonth(month, year);

            var bookings = await _bookingRepository.GetBookingsByMonth(month, year);

            decimal totalPaid = payments
                .Where(x => x.Status == common.Constant.StatusPayment.Success)
                .Sum(x => x.Amount);

            decimal refundedAmount = payments
                .Where(x => x.Status == common.Constant.StatusPayment.Refunded)
                .Sum(x => x.Amount);

            decimal pendingRefundAmount = payments
                .Where(x =>
                    x.Status == common.Constant.StatusPayment.Success
                    &&
                    x.Booking != null
                    &&
                    x.Booking.Status == common.Constant.StatusBooking.Cancelled)
                .Sum(x => x.Amount);

            decimal teacherSalary = bookings
                .Where(x => x.Status == common.Constant.StatusBooking.Completed)
                .Sum(x => x.TotalPrice);

            decimal totalHours = bookings
                .Where(x => x.Status == common.Constant.StatusBooking.Completed)
                .Sum(x => (decimal)(x.EndTime - x.StartTime).TotalHours);

            return new
            {
                TotalPaid = totalPaid,

                RefundedAmount = refundedAmount,

                PendingRefundAmount = pendingRefundAmount,

                TeacherSalary = teacherSalary,

                TotalHours = Math.Round(totalHours, 2)
            };
        }

public async Task<object> GetStudentFinanceReport(
    int month,
    int year,
    int page,
    int pageSize)
        {
            var payments =
                await _paymentRepository.GetByMonth(
                    month,
                    year);

            var query = payments
                .Where(x =>
                    x.Booking != null &&
                    x.Booking.Student != null)
                .GroupBy(x => x.Booking.StudentId)
                .Select(g => new
                {
                    StudentId = g.Key,

                    StudentName =
                        g.First().Booking.Student.Name,

                    TotalPaid = g
                        .Where(x =>
                            x.Status ==
                            common.Constant.StatusPayment.Success)
                        .Sum(x => x.Amount),

                    RefundedAmount = g
                        .Where(x =>
                            x.Status ==
                            common.Constant.StatusPayment.Refunded)
                        .Sum(x => x.Amount),

                    PendingRefundAmount = g
                        .Where(x =>
                            x.Status ==
                            common.Constant.StatusPayment.Success
                            &&
                            x.Booking.Status ==
                            common.Constant.StatusBooking.Cancelled)
                        .Sum(x => x.Amount),

                    CompletedAmount = g
                        .Where(x =>
                            x.Booking.Status ==
                            common.Constant.StatusBooking.Completed)
                        .Sum(x => x.Amount)
                });

            int total = query.Count();

            var data = query
                .OrderByDescending(x => x.TotalPaid)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new
            {
                Total = total,
                Page = page,
                PageSize = pageSize,
                Data = data
            };
        }

        public async Task<object> GetTeacherFinanceReport(
    int month,
    int year,
    int page,
    int pageSize)
        {
            var bookings =
                await _bookingRepository
                    .GetBookingsByMonth(month, year);

            var query = bookings
                .Where(x =>
                    x.Status ==
                    common.Constant.StatusBooking.Completed
                    &&
                    x.Instructor != null)
                .GroupBy(x => x.InstructorId)
                .Select(g => new
                {
                    TeacherId = g.Key,

                    TeacherName =
                        g.First().Instructor.Name,

                    TotalHours = Math.Round(
                        g.Sum(x =>
                            (decimal)(x.EndTime - x.StartTime)
                                .TotalHours),
                        2),

                    SalaryAmount =
                        g.Sum(x => x.TotalPrice)
                });

            int total = query.Count();

            var data = query
                .OrderByDescending(x => x.SalaryAmount)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new
            {
                Total = total,
                Page = page,
                PageSize = pageSize,
                Data = data
            };
        }
    }
}