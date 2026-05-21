using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;

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

        public PaymentServiceImpl(PaymentRepository paymentRepository, BookingRepository bookingRepository, TeacherAvailabilityRepository availabilityRepository, UserRepository userRepository, UserContextUtil userContext, IMapper mapper)
        {
            _paymentRepository = paymentRepository;
            _bookingRepository = bookingRepository;
            _availabilityRepository = availabilityRepository;
            _userRepository = userRepository;
            _userContext = userContext;
            _mapper = mapper;
        }

        /* 
         * tạo payment
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<PaymentDTO> Create(PaymentDTO dto)
        {
            if (dto.Amount <= 0)
            {
                throw new ArgumentException("Invalid amount");
            }

            var booking = await _bookingRepository.GetById(dto.BookingId);
            if (booking == null)
            {
                throw new KeyNotFoundException("Booking not found");
            }

            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            if (booking.StudentId != userId)
            {
                throw new UnauthorizedAccessException("You do not have permission to pay for this booking");
            }

            if (booking.Status == common.Constant.StatusBooking.Cancelled)
            {
                throw new InvalidOperationException("Booking cancelled");
            }

            if (booking.Status != common.Constant.StatusBooking.Pending)
            {
                throw new InvalidOperationException("Payment can only be created for pending bookings");
            }

            var exist = await _paymentRepository.GetByBookingId(dto.BookingId);
            if (exist != null)
            {
                throw new InvalidOperationException("Payment already exists");
            }

            var payment = _mapper.Map<Payment>(dto);
            payment.Status = common.Constant.StatusPayment.Pending;

            await _paymentRepository.Create(payment);
            await _paymentRepository.Save();

            return _mapper.Map<PaymentDTO>(payment);
        }

        /* 
         * payment success callback
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Success(int paymentId, string transactionCode)
        {
            if (string.IsNullOrWhiteSpace(transactionCode))
            {
                throw new ArgumentException("Transaction code required");
            }

            var payment = await _paymentRepository.GetById(paymentId);
            if (payment == null)
            {
                throw new Exception("Payment not found");
            }

            if (payment.Status == common.Constant.StatusPayment.Success)
            {
                throw new InvalidOperationException("Payment already succeeded");
            }

            if (payment.Status == common.Constant.StatusPayment.Failed)
            {
                throw new InvalidOperationException("Payment already failed");
            }

            payment.Status = common.Constant.StatusPayment.Success;
            payment.TransactionCode = transactionCode;
            payment.PaidAt = DateTime.UtcNow;

            var booking = await _bookingRepository.GetById(payment.BookingId);
            if (booking != null)
            {
                booking.Status = common.Constant.StatusBooking.Booked;
                await _bookingRepository.Update(booking);

                var availability = await _availabilityRepository.GetById(booking.AvailabilityId);
                if (availability != null)
                {
                    availability.IsBooked = true;
                    await _availabilityRepository.Update(availability);
                }
            }

            await _paymentRepository.Update(payment);
            await _paymentRepository.Save();
        }

        /* 
         * payment failed
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Failed(int paymentId)
        {
            var payment = await _paymentRepository.GetById(paymentId);
            if (payment == null)
            {
                throw new KeyNotFoundException("Payment not found");
            }

            if (payment.Status == common.Constant.StatusPayment.Success)
            {
                throw new InvalidOperationException("Payment already succeeded");
            }

            if (payment.Status == common.Constant.StatusPayment.Failed)
            {
                throw new InvalidOperationException("Payment already failed");
            }

            payment.Status = common.Constant.StatusPayment.Failed;

            var booking = await _bookingRepository.GetById(payment.BookingId);
            if (booking != null)
            {
                booking.Status = common.Constant.StatusBooking.Cancelled;
                await _bookingRepository.Update(booking);

                var availability = await _availabilityRepository.GetById(booking.AvailabilityId);
                if (availability != null)
                {
                    availability.IsBooked = false;
                    await _availabilityRepository.Update(availability);
                }
            }

            await _paymentRepository.Update(payment);
            await _paymentRepository.Save();
        }

        /* 
         * payment theo booking
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<PaymentDTO?> GetByBooking(int bookingId)
        {
            var payment = await _paymentRepository.GetByBookingId(bookingId);
            if (payment == null)
            {
                return null;
            }

            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            var booking = await _bookingRepository.GetById(bookingId);
            if (booking == null)
            {
                throw new KeyNotFoundException("Booking not found");
            }

            if (booking.StudentId != userId && booking.TeacherId != userId)
            {
                throw new UnauthorizedAccessException("You do not have permission to view this payment");
            }

            return _mapper.Map<PaymentDTO>(payment);
        }
    }
}