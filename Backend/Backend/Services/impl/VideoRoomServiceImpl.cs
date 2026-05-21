using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;

namespace Backend.Services.impl
{
    public class VideoRoomServiceImpl : VideoRoomService
    {
        private readonly VideoRoomRepository _videoRoomRepository;
        private readonly BookingRepository _bookingRepository;
        private readonly UserRepository _userRepository;
        private readonly UserContextUtil _userContext;
        private readonly IMapper _mapper;

        public VideoRoomServiceImpl(VideoRoomRepository videoRoomRepository, BookingRepository bookingRepository, UserRepository userRepository, UserContextUtil userContext, IMapper mapper)
        {
            _videoRoomRepository = videoRoomRepository;
            _bookingRepository = bookingRepository;
            _userRepository = userRepository;
            _userContext = userContext;
            _mapper = mapper;
        }

        /* 
         * tạo phòng học video
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<VideoRoomDTO> Create(int bookingId)
        {
            var booking = await _bookingRepository.GetById(bookingId);
            if (booking == null)
            {
                throw new KeyNotFoundException("Booking not found");
            }

            var email = _userContext.GetEmail();
            int? maybeUserId = await _userRepository.GetUserIdByEmail(email);
            if (maybeUserId == null)
            {
                throw new InvalidOperationException("Authenticated user not found");
            }

            int userId = maybeUserId.Value;

            if (booking.StudentId != userId && booking.TeacherId != userId)
            {
                throw new UnauthorizedAccessException("No permission");
            }

            if (booking.Status != common.Constant.StatusBooking.Booked)
            {
                throw new ArgumentException("Booking not paid");
            }

            var now = GetNowForComparison(booking.StartTime);
            if (now < booking.StartTime.AddMinutes(-30))
            {
                throw new ArgumentException("Room can only be created 30 minutes before class");
            }

            if (now > booking.EndTime.AddMinutes(15))
            {
                throw new ArgumentException("Room can only be created until 15 minutes after class ends");
            }

            var exist = await _videoRoomRepository.GetByBookingId(bookingId);

            if (exist != null && exist.ExpiredAt > GetNowForComparison(exist.ExpiredAt))
            {
                var existingDto = _mapper.Map<VideoRoomDTO>(exist);
                existingDto.JoinUrl = $"https://meet.jit.si/{existingDto.RoomCode}?token={existingDto.Token}";
                return existingDto;
            }

            if (exist != null)
            {
                exist.RoomCode = Guid.NewGuid().ToString();
                exist.Token = Guid.NewGuid().ToString();
                exist.ExpiredAt = booking.EndTime.AddMinutes(15);

                await _videoRoomRepository.Update(exist);
                await _videoRoomRepository.Save();

                var updatedDto = _mapper.Map<VideoRoomDTO>(exist);
                updatedDto.JoinUrl = $"https://meet.jit.si/{updatedDto.RoomCode}?token={updatedDto.Token}";
                return updatedDto;
            }

            var room = new VideoRoom
            {
                BookingId = bookingId,
                RoomCode = Guid.NewGuid().ToString(),
                Token = Guid.NewGuid().ToString(),
                ExpiredAt = booking.EndTime.AddMinutes(15)
            };

            await _videoRoomRepository.Create(room);
            await _videoRoomRepository.Save();

            var createdDto = _mapper.Map<VideoRoomDTO>(room);
            createdDto.JoinUrl = $"https://meet.jit.si/{createdDto.RoomCode}?token={createdDto.Token}";
            return createdDto;
        }

        /* 
         * lấy thông tin phòng học video theo booking id
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<VideoRoomDTO?> GetByBookingId(int bookingId)
        {
            var room = await _videoRoomRepository.GetByBookingId(bookingId);
            if (room == null)
            {
                return null;
            }

            var booking = await _bookingRepository.GetById(bookingId);
            if (booking == null)
            {
                throw new KeyNotFoundException("Booking not found");
            }

            var email = _userContext.GetEmail();
            int? maybeUserId = await _userRepository.GetUserIdByEmail(email);
            if (maybeUserId == null)
            {
                throw new InvalidOperationException("Authenticated user not found");
            }

            int userId = maybeUserId.Value;

            if (booking.StudentId != userId && booking.TeacherId != userId)
            {
                throw new UnauthorizedAccessException("No permission");
            }

            if (room.ExpiredAt <= GetNowForComparison(room.ExpiredAt))
            {
                throw new ArgumentException("Room expired");
            }

            var dto = _mapper.Map<VideoRoomDTO>(room);
            dto.JoinUrl = $"https://meet.jit.si/{dto.RoomCode}?token={dto.Token}";
            return dto;
        }

        private DateTime GetNowForComparison(DateTime referenceTime)
        {
            return referenceTime.Kind == DateTimeKind.Utc
                ? DateTime.UtcNow
                : DateTime.Now;
        }
    }
}