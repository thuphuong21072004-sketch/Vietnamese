using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class VideoRoomRepositoryImpl : VideoRoomRepository
    {
        private readonly AppDbContext _context;

        public VideoRoomRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * lấy thông tin phòng học video theo id
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<VideoRoom?> GetById(int id)
        {
            return await _context.VideoRooms.FirstOrDefaultAsync(x => x.RoomId == id);
        }

        /* 
         * lấy thông tin phòng học video theo booking id
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<VideoRoom?> GetByBookingId(int bookingId)
        {
            return await _context.VideoRooms.FirstOrDefaultAsync(x => x.BookingId == bookingId);
        }

        /* 
         * tạo mới phòng học video
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Create(VideoRoom room)
        {
            await _context.VideoRooms.AddAsync(room);
        }

        /* 
         * cập nhật thông tin phòng học video
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Update(VideoRoom room)
        {
            _context.VideoRooms.Update(room);
            await Task.CompletedTask;
        }

        /* 
         * lưu thay đổi vào cơ sở dữ liệu
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }
    }
}