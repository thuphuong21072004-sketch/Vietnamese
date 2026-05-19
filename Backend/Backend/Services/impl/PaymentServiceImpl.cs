using AutoMapper;
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
        private readonly IMapper _mapper;

        public PaymentServiceImpl(PaymentRepository paymentRepository, BookingRepository bookingRepository, TeacherAvailabilityRepository availabilityRepository, IMapper mapper)
        {
            _paymentRepository = paymentRepository;
            _bookingRepository = bookingRepository;
            _availabilityRepository = availabilityRepository;
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
                throw new Exception("Invalid amount");
            }

            var booking = await _bookingRepository.GetById(dto.BookingId);
            if (booking == null)
            {
                throw new Exception("Booking not found");
            }

            if (booking.Status == common.Constant.StatusBooking.Cancelled)
            {
                throw new Exception("Booking cancelled");
            }

            var exist = await _paymentRepository.GetByBookingId(dto.BookingId);
            if (exist != null)
            {
                throw new Exception("Payment already exists");
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
                throw new Exception("Transaction code required");
            }

            var payment = await _paymentRepository.GetById(paymentId);
            if (payment == null)
            {
                throw new Exception("Payment not found");
            }

            if (payment.Status == common.Constant.StatusPayment.Success)
            {
                throw new Exception("Payment already success");
            }

            if (payment.Status == common.Constant.StatusPayment.Failed)
            {
                throw new Exception("Payment already failed");
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
                throw new Exception("Payment not found");
            }

            if (payment.Status == common.Constant.StatusPayment.Success)
            {
                throw new Exception("Payment already success");
            }

            if (payment.Status == common.Constant.StatusPayment.Failed)
            {
                throw new Exception("Payment already failed");
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

            return _mapper.Map<PaymentDTO>(payment);
        }
    }
}