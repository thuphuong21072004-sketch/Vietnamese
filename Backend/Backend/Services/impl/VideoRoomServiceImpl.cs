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
        public async Task<VideoRoomDTO>
Create(int bookingId)
        {
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
            var email = _userContext.GetEmail();

            int? maybeUserId =
                await _userRepository
                    .GetUserIdByEmail(email);

            if (maybeUserId == null)
            {
                throw new InvalidOperationException(
                    "Authenticated user not found");
            }

            int userId = maybeUserId.Value;

            /*
             * chỉ student hoặc instructor
             * mới được tạo room
             */
            if (booking.StudentId != userId
                && booking.InstructorId != userId)
            {
                throw new UnauthorizedAccessException(
                    "No permission");
            }

            /*
             * booking phải paid
             * hoặc đang học
             */
            if (
    booking.Status !=
    common.Constant
    .StatusBooking.Confirmed

    &&

    booking.Status !=
    common.Constant
    .StatusBooking.InProgress
)
            {
                throw new ArgumentException(
                    "Booking is not active");
            }

            /*
             * chỉ tạo room
             * trước giờ học 30 phút
             */
            var now =
                GetNowForComparison(
                    booking.StartTime);

            if (now <
                booking.StartTime
                    .AddMinutes(-30))
            {
                throw new ArgumentException(
                    "Room can only be created 30 minutes before class");
            }

            /*
             * chỉ tồn tại tới
             * 15 phút sau giờ học
             */
            if (now >
                booking.EndTime
                    .AddMinutes(15))
            {
                throw new ArgumentException(
                    "Room can only be created until 15 minutes after class ends");
            }

            /*
             * kiểm tra room tồn tại
             */
            var exist =
                await _videoRoomRepository
                    .GetByBookingId(
                        bookingId);

            /*
             * room còn hạn
             */
            if (exist != null
                && exist.ExpiredAt >
                GetNowForComparison(
                    exist.ExpiredAt))
            {
                var existingDto =
                    _mapper.Map<VideoRoomDTO>(
                        exist);

                existingDto.JoinUrl =
                    $"https://meet.jit.si/{existingDto.RoomCode}";

                return existingDto;
            }


            /*
             * room hết hạn
             * tạo token mới
             */
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
                    booking.EndTime
                        .AddMinutes(15);

                await _videoRoomRepository
                    .Update(exist);

                await _videoRoomRepository
                    .Save();

                var updatedDto =
                    _mapper.Map<VideoRoomDTO>(
                        exist);

                updatedDto.JoinUrl =
                    $"https://meet.jit.si/{updatedDto.RoomCode}";

                return updatedDto;
            }

            /*
             * tạo room mới
             */
            var roomCode =
                Guid.NewGuid().ToString();

            var room = new VideoRoom
            {
                BookingId = bookingId,

                RoomCode = roomCode,

                HostToken =
                    Guid.NewGuid().ToString(),

                StudentToken =
                    Guid.NewGuid().ToString(),

                StartUrl =
                    $"https://meet.jit.si/{roomCode}",

                ExpiredAt =
                    booking.EndTime
                        .AddMinutes(15),

                CreatedDate =
                    DateTime.UtcNow
            };

            await _videoRoomRepository
                .Create(room);

            await _videoRoomRepository
                .Save();

            var createdDto =
                _mapper.Map<VideoRoomDTO>(
                    room);

            createdDto.JoinUrl =
                $"https://meet.jit.si/{createdDto.RoomCode}";

            return createdDto;
        }

        /* 
         * lấy thông tin phòng học video theo booking id
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<VideoRoomDTO?>
GetByBookingId(int bookingId)
        {
            /*
             * tìm room
             */
            var room =
                await _videoRoomRepository
                    .GetByBookingId(
                        bookingId);

            if (room == null)
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
            var email = _userContext.GetEmail();

            int? maybeUserId =
                await _userRepository
                    .GetUserIdByEmail(email);

            if (maybeUserId == null)
            {
                throw new InvalidOperationException(
                    "Authenticated user not found");
            }

            int userId = maybeUserId.Value;

            /*
             * chỉ student hoặc instructor
             * mới được xem room
             */
            if (booking.StudentId != userId
                && booking.InstructorId != userId)
            {
                throw new UnauthorizedAccessException(
                    "No permission");
            }

            /*
             * room hết hạn
             */
            if (room.ExpiredAt <=
                GetNowForComparison(
                    room.ExpiredAt))
            {
                throw new ArgumentException(
                    "Room expired");
            }

            var dto =
                _mapper.Map<VideoRoomDTO>(
                    room);

            dto.JoinUrl =
                $"https://meet.jit.si/{dto.RoomCode}";

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