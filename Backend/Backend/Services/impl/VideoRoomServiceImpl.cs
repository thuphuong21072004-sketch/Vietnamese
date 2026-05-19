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
                throw new Exception("Booking not found");
            }

            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            if (booking.StudentId != userId && booking.TeacherId != userId)
            {
                throw new UnauthorizedAccessException("No permission");
            }

            if (booking.Status != common.Constant.StatusBooking.Booked)
            {
                throw new Exception("Booking not paid");
            }

            if (booking.EndTime <= DateTime.UtcNow)
            {
                throw new Exception("Class has ended");
            }

            if (booking.StartTime > DateTime.UtcNow.AddMinutes(30))
            {
                throw new Exception("Room can only be created 30 minutes before class");
            }

            var exist = await _videoRoomRepository.GetByBookingId(bookingId);

            if (exist != null && exist.ExpiredAt > DateTime.UtcNow)
            {
                return _mapper.Map<VideoRoomDTO>(exist);
            }

            if (exist != null)
            {
                exist.RoomCode = Guid.NewGuid().ToString();
                exist.Token = Guid.NewGuid().ToString();
                exist.ExpiredAt = booking.EndTime;

                await _videoRoomRepository.Update(exist);
                await _videoRoomRepository.Save();

                return _mapper.Map<VideoRoomDTO>(exist);
            }

            var room = new VideoRoom
            {
                BookingId = bookingId,
                RoomCode = Guid.NewGuid().ToString(),
                Token = Guid.NewGuid().ToString(),
                ExpiredAt = booking.EndTime
            };

            await _videoRoomRepository.Create(room);
            await _videoRoomRepository.Save();

            return _mapper.Map<VideoRoomDTO>(room);
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
                throw new Exception("Booking not found");
            }

            var email = _userContext.GetEmail();
            int userId = (await _userRepository.GetUserIdByEmail(email))!.Value;

            if (booking.StudentId != userId && booking.TeacherId != userId)
            {
                throw new UnauthorizedAccessException("No permission");
            }

            if (room.ExpiredAt <= DateTime.UtcNow)
            {
                throw new Exception("Room expired");
            }

            return _mapper.Map<VideoRoomDTO>(room);
        }
    }
}