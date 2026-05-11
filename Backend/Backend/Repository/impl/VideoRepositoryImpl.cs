using System.Net.Http.Json;
using Backend.Common;
using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class VideoRepositoryImpl : VideoRepository
    {
        private readonly HttpClient _http;
        private readonly AppDbContext _context;
        private readonly UserContextUtil _userContext;

        public VideoRepositoryImpl(
            HttpClient http,
            AppDbContext context,
            IHttpContextAccessor httpContextAccessor,
            UserContextUtil userContext)
        {
            _http = http;
            _context = context;
            _userContext = userContext;
        }

        /*
         * Import video từ Youtube vào hệ thống
         * O(1)
         * thuphuong21072004
         */
        public async Task ImportVideo(string youtubeId)
        {
            await _http.PostAsJsonAsync(
                "http://localhost:5001/crawl",
                new
                {
                    youtubeId,
                    createdBy = _userContext.GetUserId()
                });
        }

        /*
         * Lấy danh sách video theo trạng thái
         * O(n)
         * thuphuong21072004
         */
        public async Task<List<Video>> GetAllVideos(int? status, int page, int pageSize)
        {
            IQueryable<Video> query = _context.Videos;

            if (status.HasValue)
            {
                query = query.Where(v => v.Status == status.Value);
            }

            return await query
                .OrderByDescending(v => v.VideoId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        /*
         * Tìm kiếm transcript theo từ khóa
         * O(n)
         * thuphuong21072004
         */
        public async Task<List<Transcript>> Search(string keyword, int page, int pageSize)
        {
            return await _context.Transcripts
                .Include(t => t.Video)
                .Where(t =>
                    t.Sentence.Contains(keyword) &&
                    t.Video != null &&
                    t.Video.Status == 1)
                .GroupBy(t => t.VideoId)
                .Select(g => g.OrderBy(t => t.StartTime).First())
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        /*
         * Cập nhật trạng thái video
         * O(1)
         * thuphuong21072004
         */
        public async Task UpdateVideo(int videoId, int status)
        {
            var video = await _context.Videos.FindAsync(videoId);

            if (video == null)
            {
                return;
            }

            video.Status = status;

            await _context.SaveChangesAsync();
        }

        /*
         * Tìm kiếm video theo YoutubeId
         * O(n)
         * thuphuong21072004
         */
        public async Task<Video?> SearchVideo(string youtubeId)
        {
            return await _context.Videos
                .FirstOrDefaultAsync(v => v.YoutubeId == youtubeId);
        }
    }
}