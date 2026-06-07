using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;
using Microsoft.AspNetCore.Http;
using static Backend.common.Constant;

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
        private readonly ClassEnrollmentRepository _classEnrollmentRepository;
        private readonly TeacherClassRepository _teacherClassRepository;
        public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            TeacherAvailabilityRepository availabilityRepository,
            UserRepository userRepository,
            UserContextUtil userContext,
            IMapper mapper,
           StripeService stripeService, ExchangeRateService exchangeRateService,
            IHttpContextAccessor httpContextAccessor, ClassEnrollmentRepository classEnrollmentRepository, TeacherClassRepository teacherClassRepository)
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
            _classEnrollmentRepository = classEnrollmentRepository;
            _teacherClassRepository = teacherClassRepository;
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

            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

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
                    booking.Status ==
                    StatusBooking.Cancelled
                )
                {
                    throw new InvalidOperationException(
                        "Booking cancelled");
                }

                if (
                    booking.Status !=
                    StatusBooking.PendingPayment
                )
                {
                    throw new InvalidOperationException(
                        "Booking is not waiting for payment");
                }
            }
            else if (dto.RefName == RefName.Class)
            {
                var enrollment =
                    await _classEnrollmentRepository.GetByIdAsync(dto.RefId);

                if (enrollment == null)
                {
                    throw new KeyNotFoundException(
                        "Enrollment not found");
                }

                if (enrollment.StudentId != userId)
                {
                    throw new UnauthorizedAccessException(
                        "No permission");
                }
            }
            else
            {
                throw new InvalidOperationException(
                    "Invalid RefName");
            }

            var exist =
                await _paymentRepository
                    .GetByRef(
                        dto.RefName,
                        dto.RefId);

            if (exist != null)
            {
                if (
                    exist.Status ==
                    StatusPayment.Pending
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
                    StatusPayment.Pending
                    &&
                    exist.CreatedDate
                        .AddMinutes(15)
                    <= DateTime.Now
                )
                {
                    exist.Status =
                        StatusPayment.Expired;

                    await _paymentRepository
                        .Update(exist);
                }
            }

            var payment =
                _mapper.Map<Payment>(dto);

            payment.Status =
                StatusPayment.Pending;

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
        public async Task Success( int paymentId, string transactionCode)
        {
            Console.WriteLine(
                $"ENTER SUCCESS: {paymentId}");

            if (string.IsNullOrWhiteSpace(transactionCode))
            {
                throw new ArgumentException(
                    "Transaction code required");
            }

            var payment =
                await _paymentRepository
                    .GetById(paymentId);

            if (payment == null)
            {
                throw new KeyNotFoundException(
                    "Payment not found");
            }

            if (payment.Status ==
                StatusPayment.Success)
            {
                throw new InvalidOperationException(
                    "Payment already succeeded");
            }

            if (payment.Status ==
                StatusPayment.Failed)
            {
                throw new InvalidOperationException(
                    "Payment already failed");
            }

            if (payment.Status ==
                StatusPayment.Expired)
            {
                throw new InvalidOperationException(
                    "Payment expired");
            }

            payment.Status =
                StatusPayment.Success;

            payment.TransactionCode =
                transactionCode;

            payment.PaidAt =
                DateTime.Now;

            if (payment.RefName == RefName.Booking)
            {
                var booking =
                    await _bookingRepository
                        .GetById(payment.RefId);

                if (booking != null)
                {
                    booking.Status =
                        StatusBooking.Confirmed;

                    await _bookingRepository
                        .Update(booking);
                }
            }
            else if (payment.RefName == RefName.Class)
            {
                var enrollment =
                    await _classEnrollmentRepository.GetByIdAsync(
                        payment.RefId);

                if (enrollment == null)
                {
                    throw new KeyNotFoundException(
                        "Enrollment not found");
                }

                enrollment.Status =
                    StatusBooking.Confirmed;

                await _classEnrollmentRepository
                    .UpdateAsync(enrollment);

                var teacherClass =
                    await _teacherClassRepository
                        .GetByIdAsync(enrollment.ClassId);

                if (teacherClass != null)
                {
                    teacherClass.CurrentStudents++;

                    await _teacherClassRepository
                        .UpdateAsync(teacherClass);
                }
            }
            else
            {
                throw new InvalidOperationException(
                    "Invalid RefName");
            }

            await _paymentRepository
                .Update(payment);

            await _paymentRepository
                .Save();
        }

        /*
         * payment theo booking
         */
        public async Task<PaymentDTO?> GetByRef( string refName, int refId)
        {
            var payment =
                await _paymentRepository
                    .GetByRef(
                        refName,
                        refId);

            if (payment == null)
            {
                return null;
            }

            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            if (refName == RefName.Booking)
            {
                var booking =
                    await _bookingRepository
                        .GetById(refId);

                if (booking == null)
                {
                    throw new KeyNotFoundException(
                        "Booking not found");
                }

                if (
                    booking.StudentId != userId
                    &&
                    booking.InstructorId != userId
                )
                {
                    throw new UnauthorizedAccessException(
                        "No permission");
                }
            }
            else if (refName == RefName.Class)
            {
                var enrollment =
                    await _classEnrollmentRepository.GetByIdAsync(refId);
                if (enrollment == null)
                {
                    throw new KeyNotFoundException(
                        "Enrollment not found");
                }

                if (enrollment.StudentId != userId)
                {
                    throw new UnauthorizedAccessException(
                        "No permission");
                }
            }
            else
            {
                throw new InvalidOperationException(
                    "Invalid RefName");
            }

            return _mapper.Map<PaymentDTO>(
                payment);
        }

        /*
         * tạo url stripeUrl
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

    }
}