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

            int? maybeUserId =
                await _userRepository.GetUserIdByEmail(email);

            if (maybeUserId == null)
            {
                throw new InvalidOperationException(
                    "Authenticated user not found");
            }

            int userId = maybeUserId.Value;

            if (
                booking.StudentId != userId &&
                booking.InstructorId != userId
            )
            {
                throw new UnauthorizedAccessException(
                    "No permission");
            }

            if (
                booking.Status != common.Constant.StatusBooking.Confirmed &&
                booking.Status != common.Constant.StatusBooking.InProgress
            )
            {
                throw new ArgumentException(
                    "Booking is not active");
            }

            var now =
                GetNowForComparison(
                    booking.StartTime);

            if (
                now <
                booking.StartTime.AddMinutes(-30)
            )
            {
                throw new ArgumentException(
                    "Room can only be created 30 minutes before class");
            }

            if (
                now >
                booking.EndTime.AddMinutes(15)
            )
            {
                throw new ArgumentException(
                    "Room can only be created until 15 minutes after class ends");
            }

            var exist =
                await _videoRoomRepository
                    .GetByBookingId(bookingId);

            if (
                exist != null &&
                exist.ExpiredAt >
                GetNowForComparison(exist.ExpiredAt)
            )
            {
                var existingDto =
                    _mapper.Map<VideoRoomDTO>(exist);

                existingDto.JoinUrl = null;

                return existingDto;
            }

            if (exist != null)
            {
                exist.RoomCode =
                    Guid.NewGuid().ToString();

                exist.HostToken =
                    Guid.NewGuid().ToString();

                exist.StudentToken =
                    Guid.NewGuid().ToString();

                exist.StartUrl =
                    $"https://meet.jit.si/{exist.RoomCode}";

                exist.ExpiredAt =
                    booking.EndTime.AddMinutes(15);

                await _videoRoomRepository
                    .Update(exist);

                await _videoRoomRepository
                    .Save();

                var updatedDto =
                    _mapper.Map<VideoRoomDTO>(exist);

                updatedDto.JoinUrl = null;

                return updatedDto;
            }

            var roomCode =
                Guid.NewGuid().ToString();

            var room = new VideoRoom
            {
                RefId = bookingId,
                RefName = common.Constant.RefName.Booking,

                RoomCode = roomCode,

                HostToken =
                    Guid.NewGuid().ToString(),

                StudentToken =
                    Guid.NewGuid().ToString(),

                StartUrl =
                    $"https://meet.jit.si/{roomCode}",

                ExpiredAt =
                    booking.EndTime.AddMinutes(15),

                CreatedDate =
                    DateTime.UtcNow
            };

            await _videoRoomRepository
                .Create(room);

            await _videoRoomRepository
                .Save();

            var createdDto =
                _mapper.Map<VideoRoomDTO>(room);

            createdDto.JoinUrl = null;

            return createdDto;
        }

        public async Task<string> JoinRoom(int bookingId)
        {
            var room =
                await _videoRoomRepository
                    .GetByBookingId(bookingId);

            if (room == null)
            {
                throw new KeyNotFoundException(
                    "Room not found");
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

            int? maybeUserId =
                await _userRepository
                    .GetUserIdByEmail(email);

            if (maybeUserId == null)
            {
                throw new InvalidOperationException(
                    "Authenticated user not found");
            }

            int userId = maybeUserId.Value;

            if (
                booking.StudentId != userId &&
                booking.InstructorId != userId
            )
            {
                throw new UnauthorizedAccessException(
                    "No permission");
            }

            if (
                booking.Status != common.Constant.StatusBooking.Confirmed &&
                booking.Status != common.Constant.StatusBooking.InProgress
            )
            {
                throw new ArgumentException(
                    "Booking is not active");
            }

            var now =
                GetNowForComparison(
                    booking.StartTime);

            if (
                now <
                booking.StartTime.AddMinutes(-15)
            )
            {
                throw new ArgumentException(
                    "Class has not started yet");
            }

            if (
                now >
                booking.EndTime.AddMinutes(15)
            )
            {
                throw new ArgumentException(
                    "Class expired");
            }

            if (
                room.ExpiredAt <=
                GetNowForComparison(room.ExpiredAt)
            )
            {
                throw new ArgumentException(
                    "Room expired");
            }

            return room.StartUrl;
        }

        private DateTime GetNowForComparison(
            DateTime referenceTime)
        {
            return referenceTime.Kind ==
                   DateTimeKind.Utc
                ? DateTime.UtcNow
                : DateTime.Now;
        }
    }
}