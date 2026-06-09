using System.Diagnostics;
using System.Text.Json;
using Backend.Common;
using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class VideoRepositoryImpl : VideoRepository
    {
        private readonly AppDbContext _context;
        private readonly UserContextUtil _userContext;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public VideoRepositoryImpl(
            AppDbContext context,
            UserContextUtil userContext,
            IConfiguration configuration,
            IWebHostEnvironment environment)
        {
            _context = context;
            _userContext = userContext;
            _configuration = configuration;
            _environment = environment;
        }

        public async Task ImportVideo(string youtubeId)
        {
            var python = _configuration["TextToSpeech:PythonExecutable"] ?? "python";
            var script = Path.Combine(_environment.ContentRootPath, "Scripts", "crawl.py");

            var info = new ProcessStartInfo
            {
                FileName = python,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            };
            info.ArgumentList.Add(script);
            info.ArgumentList.Add(youtubeId);

            using var process = new Process { StartInfo = info };
            process.Start();
            var stdout = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (string.IsNullOrWhiteSpace(stdout))
                throw new InvalidOperationException("crawl.py returned no output.");

            var result = JsonSerializer.Deserialize<CrawlResult>(stdout, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result == null || !string.IsNullOrEmpty(result.Error))
                throw new InvalidOperationException(result?.Error ?? "Failed to parse crawl output.");

            var createdBy = _userContext.GetEmail();
            var existing = await _context.Videos.FirstOrDefaultAsync(v => v.YoutubeId == youtubeId);

            int videoId;
            if (existing == null)
            {
                var video = new Video
                {
                    YoutubeId = youtubeId,
                    Title = result.Title ?? youtubeId,
                    CreatedBy = createdBy,
                    Status = 1
                };
                _context.Videos.Add(video);
                await _context.SaveChangesAsync();
                videoId = video.VideoId;
            }
            else
            {
                videoId = existing.VideoId;
            }

            var old = _context.Transcripts.Where(t => t.VideoId == videoId);
            _context.Transcripts.RemoveRange(old);

            if (result.Transcripts?.Count > 0)
            {
                var rows = result.Transcripts.Select(t => new Transcript
                {
                    VideoId = videoId,
                    Sentence = t.Text,
                    StartTime = t.Start
                }).ToList();
                _context.Transcripts.AddRange(rows);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<List<Video>> GetAllVideos(int? status, int page, int pageSize)
        {
            IQueryable<Video> query = _context.Videos;

            if (status.HasValue)
                query = query.Where(v => v.Status == status.Value);

            return await query
                .OrderByDescending(v => v.VideoId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

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

        public async Task UpdateVideo(int videoId, int status)
        {
            var video = await _context.Videos.FindAsync(videoId);
            if (video == null) return;
            video.Status = status;
            await _context.SaveChangesAsync();
        }

        public async Task<Video?> SearchVideo(string youtubeId)
        {
            return await _context.Videos
                .FirstOrDefaultAsync(v => v.YoutubeId == youtubeId);
        }

        private sealed class CrawlResult
        {
            public string? Title { get; set; }
            public List<TranscriptLine>? Transcripts { get; set; }
            public string? Error { get; set; }
        }

        private sealed class TranscriptLine
        {
            public string Text { get; set; } = string.Empty;
            public double Start { get; set; }
        }
    }
}
