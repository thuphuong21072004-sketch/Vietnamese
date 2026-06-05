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
                    .GetById(dto.RefId);

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
                        dto.RefId);

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
                        payment.RefId);

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
                        payment.RefId);

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

    }
}