using AutoMapper;
using Backend.Common;
using Backend.dto;
using Backend.Mapper;
using Backend.Models;
using Backend.Repository;

namespace Backend.Services.impl
{
    public class VideoServiceImpl : VideoService
    {
        private readonly VideoRepository _videoRepository;
        private readonly IMapper _mapper;
        private readonly UserContextUtil _userContext;
        public VideoServiceImpl(VideoRepository videoRepository, IMapper mapper, UserContextUtil userContext)
        {
            _videoRepository = videoRepository;
            _mapper = mapper;
            _userContext = userContext;
        }

        // validate
        /*
         * kiểm tra quyền là admin
         * 
         * thuphuong21072004
         */
        private bool ValidateAdmin()
        {
            string role = _userContext.GetRole();
            if (role == common.Constant.Role.Admin)
            {
                return true;
            }
            return false;
        }
       
        /*
         * kiêm tra cong tac vien
         * 
         * thuphuong21072004
         */
        private bool ValidateModerator()
        {
            string role = _userContext.GetRole();
            if (role == common.Constant.Role.Moderator) { return true; }
            return false;
        }
        /*
         * kiểm tra chuẩn youtubeId
         * 
         * thuphuong21072004
         */
        private bool IsValidYoutubeId(string youtubeId)
        {
            if (string.IsNullOrWhiteSpace(youtubeId))
                return false;

            return System.Text.RegularExpressions.Regex.IsMatch(
                youtubeId,
                @"^[a-zA-Z0-9_-]{11}$"
            );
        }
        /*
         * thêm video mới vào hệ thống
         * 13/03/2026
         * thuphuong21072004
         */
        public async Task ImportVideo(string youtubeId)
        {
            try
            {
                if (!ValidateAdmin() && !ValidateModerator())
                {
                    throw new UnauthorizedAccessException("You do not have permission to import videos.");
                }

                if (!IsValidYoutubeId(youtubeId))
                {
                    throw new Exception("Invalid youtube ID.");
                }

                await _videoRepository.ImportVideo(youtubeId);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString()); 
                throw;
            }
        }
        /*
         * lấy danh sách video theo trạng thái (phân trang)
         * 14/03/2026
         * thuphuong21072004
         */
        public async Task<List<VideoDTO>> GetAllVideos(int? status, int page, int pageSize)
        {
            var videos = await _videoRepository.GetAllVideos(status,page,pageSize);

            return _mapper.Map<List<Video>, List<VideoDTO>>(videos);
        }
        /*
         * tìm kiếm video theo từ khóa trong transcript (phân trang)
         * 07/03/2026
         * thuphuong21072004
         */
        public async Task<List<TranscriptDTO>> Search(string keyword, int page, int pageSize)
        {
            var transcripts = await _videoRepository.Search(keyword,page,pageSize);

            return _mapper.Map<List<Transcript>, List<TranscriptDTO>>(transcripts);
        }
        /*
         * cập nhật trạng thái video
         * 14/03/2026
         * thuphuong21072004
         */
        public async Task updateVideo(int videoId, int status)
        {
            if (!ValidateAdmin() )
            {
                throw new UnauthorizedAccessException("You do not have permission to update videos.");
            }
            await _videoRepository.UpdateVideo(videoId, status);
        }
        /*
         * lấy video theo youtubeId
         * 18/03/2026
         * thuphuong21072004
         */
        public async Task<VideoDTO> GetVideo(string videoId)
        {
            var video = await _videoRepository.SearchVideo(videoId);

            if (video == null) return null;

            return _mapper.Map<Video, VideoDTO>(video);
        }
    }
}
