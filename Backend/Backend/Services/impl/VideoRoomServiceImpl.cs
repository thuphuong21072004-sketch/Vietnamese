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
        private readonly TeacherClassRepository _teacherClassRepository;

        private readonly ClassEnrollmentRepository _classEnrollmentRepository;
        private readonly UserRepository _userRepository;
        private readonly UserContextUtil _userContext;
        private readonly IMapper _mapper;
        private readonly BookingRepository _bookingRepository;
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
        public async Task<VideoRoomDTO> Create(
    string refName,
    int refId)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                ?? throw new Exception(
                    "User not found");

            var room =
                await _videoRoomRepository
                    .GetByRef(
                        refName,
                        refId);

            if (room != null)
            {
                return _mapper.Map<VideoRoomDTO>(
                    room);
            }

            var roomCode =
                Guid.NewGuid().ToString();

            room = new VideoRoom
            {
                RefName = refName,

                RefId = refId,

                RoomCode = roomCode,

                HostToken =
                    Guid.NewGuid().ToString(),

                StudentToken =
                    Guid.NewGuid().ToString(),

                StartUrl =
                    $"https://meet.jit.si/{roomCode}",

                ExpiredAt =
                    DateTime.UtcNow.AddYears(1),

                CreatedDate =
                    DateTime.UtcNow
            };

            await _videoRoomRepository
                .Create(room);

            await _videoRoomRepository
                .Save();

            return _mapper.Map<VideoRoomDTO>(
                room);
        }

        public async Task<string> JoinRoom(
    string refName,
    int refId)
        {
            var email =
                _userContext.GetEmail();

            int userId =
                (await _userRepository
                    .GetUserIdByEmail(email))
                ?? throw new Exception(
                    "User not found");

            var room =
                await _videoRoomRepository
                    .GetByRef(
                        refName,
                        refId);

            /*
             * chưa có phòng thì tạo
             */
            if (room == null)
            {
                await Create(
                    refName,
                    refId);

                room =
                    await _videoRoomRepository
                        .GetByRef(
                            refName,
                            refId);
            }

            if (room == null)
            {
                throw new KeyNotFoundException(
                    "Room not found");
            }

            
            if (refName == common.Constant.RefName.Booking)
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
                    booking.StudentId != userId &&
                    booking.InstructorId != userId
                )
                {
                    throw new UnauthorizedAccessException(
                        "No permission");
                }
            }

            
            else if (
                refName ==
                common.Constant.RefName.Class
            )
            {
                var teacherClass =
                    await _teacherClassRepository
                        .GetById(refId);

                if (teacherClass == null)
                {
                    throw new KeyNotFoundException(
                        "Class not found");
                }

                bool isTeacher =
                    teacherClass
                        .TeacherProfile
                        ?.UserId == userId;

                var enrollment =
                    await _classEnrollmentRepository
                        .GetByClassAndStudent(
                            refId,
                            userId);

                bool isStudent =
                    enrollment != null;

                if (
                    !isTeacher &&
                    !isStudent
                )
                {
                    throw new UnauthorizedAccessException(
                        "No permission");
                }
            }

            return room.StartUrl
                ?? throw new Exception(
                    "Join url not found");
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