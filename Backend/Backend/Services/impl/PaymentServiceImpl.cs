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
        private readonly VNPayService _vnpayService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            TeacherAvailabilityRepository availabilityRepository,
            UserRepository userRepository,
            UserContextUtil userContext,
            IMapper mapper,
            VNPayService vnpayService,
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

            _vnpayService =
                vnpayService;

            _httpContextAccessor =
                httpContextAccessor;
        }

        /*
         * tạo payment
         */
        public async Task<PaymentDTO>
        Create(PaymentDTO dto)
        {
            /*
             * validate amount
             */
            if (dto.Amount <= 0)
            {
                throw new ArgumentException(
                    "Invalid amount");
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
             * user hiện tại
             */
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            /*
             * chỉ student được thanh toán
             */
            if (booking.StudentId != userId)
            {
                throw new UnauthorizedAccessException(
                    "No permission");
            }

            /*
             * booking đã hủy
             */
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

            /*
             * chỉ pending payment
             */
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

            /*
             * payment đã tồn tại
             */
            var exist =
                await _paymentRepository
                    .GetByBookingId(
                        dto.BookingId);

            if (exist != null)
            {
                /*
                 * payment pending chưa hết hạn
                 */
                if (
                    exist.Status ==
                   common.Constant
                        .StatusPayment
                        .Pending
                    &&
                    exist.CreatedDate
                        .AddMinutes(5)
                        > DateTime.UtcNow
                )
                {
                    throw new InvalidOperationException(
                        "Payment already exists");
                }

                /*
                 * payment cũ hết hạn
                 */
                if (
                    exist.Status ==
                   common.Constant
                        .StatusPayment
                        .Pending
                    &&
                    exist.CreatedDate
                        .AddMinutes(5)
                        <= DateTime.UtcNow
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

            /*
             * tạo payment mới
             */
            var payment =
                _mapper.Map<Payment>(dto);

            payment.Status =
               common.Constant
                    .StatusPayment
                    .Pending;

            payment.CreatedDate =
                DateTime.UtcNow;

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
        public async Task
        Success(
            int paymentId,
            string transactionCode)
        {
            /*
             * validate transaction code
             */
            if (
                string.IsNullOrWhiteSpace(
                    transactionCode)
            )
            {
                throw new ArgumentException(
                    "Transaction code required");
            }

            /*
             * tìm payment
             */
            var payment =
                await _paymentRepository
                    .GetById(paymentId);

            if (payment == null)
            {
                throw new KeyNotFoundException(
                    "Payment not found");
            }

            /*
             * payment success rồi
             */
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

            /*
             * payment failed
             */
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

            /*
             * payment expired
             */
            if (
                payment.Status ==
               common.Constant
                    .StatusPayment
                    .Expired
            )
            {
                throw new InvalidOperationException(
                    "Payment expired");
            }

            /*
             * cập nhật payment
             */
            payment.Status =
               common.Constant
                    .StatusPayment
                    .Success;

            payment.TransactionCode =
                transactionCode;

            payment.PaidAt =
                DateTime.UtcNow;

            /*
             * cập nhật booking
             */
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
        }

        /*
         * payment failed
         */
        public async Task
        Failed(int paymentId)
        {
            /*
             * tìm payment
             */
            var payment =
                await _paymentRepository
                    .GetById(paymentId);

            if (payment == null)
            {
                throw new KeyNotFoundException(
                    "Payment not found");
            }

            /*
             * payment success rồi
             */
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

            /*
             * payment failed rồi
             */
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

            /*
             * cập nhật failed
             */
            payment.Status =
               common.Constant
                    .StatusPayment
                    .Failed;

            /*
             * booking quay về pending payment
             */
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
        public async Task<PaymentDTO?>
        GetByBooking(int bookingId)
        {
            /*
             * tìm payment
             */
            var payment =
                await _paymentRepository
                    .GetByBookingId(
                        bookingId);

            if (payment == null)
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
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))!
                    .Value;

            /*
             * check permission
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
             * payment hết hạn
             */
            if (
                payment.Status ==
               common.Constant
                    .StatusPayment
                    .Pending
                &&
                payment.CreatedDate
                    .AddMinutes(5)
                    <= DateTime.UtcNow
            )
            {
                payment.Status =
                   common.Constant
                        .StatusPayment
                        .Expired;

                /*
                 * booking cancel
                 */
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

                await _paymentRepository
                    .Update(payment);

                await _paymentRepository
                    .Save();
            }

            return _mapper.Map<PaymentDTO>(
                payment);
        }

        /*
         * tạo url vnpay
         */
        public async Task<string>
        CreateVNPayUrl(int paymentId)
        {
            var payment =
                await _paymentRepository
                    .GetById(paymentId);

            if (payment == null)
            {
                throw new Exception(
                    "Payment not found");
            }

            /*
             * chỉ payment pending
             */
            if (
                payment.Status !=
               common.Constant
                    .StatusPayment
                    .Pending
            )
            {
                throw new InvalidOperationException(
                    "Payment is not pending");
            }

            /*
             * payment expired
             */
            if (
                payment.CreatedDate
                    .AddMinutes(5)
                    <= DateTime.UtcNow
            )
            {
                payment.Status =
                   common.Constant
                        .StatusPayment
                        .Expired;

                await _paymentRepository
                    .Update(payment);

                await _paymentRepository
                    .Save();

                throw new InvalidOperationException(
                    "Payment expired");
            }

            /*
             * FIX IPV6
             */
            var ipAddress =
                "127.0.0.1";

            return _vnpayService
                .CreatePaymentUrl(
                    payment.PaymentId,
                    payment.Amount,
                    ipAddress);
        }
    }
}