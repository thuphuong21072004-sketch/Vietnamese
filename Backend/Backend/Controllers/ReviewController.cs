using Backend.Common;
using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/reviews")]
    public class ReviewController
        : ControllerBase
    {
        private readonly ReviewService
            _reviewService;

        public ReviewController(
            ReviewService reviewService
        )
        {
            _reviewService =
                reviewService;
        }

        /*
         * student đánh giá teacher
         */
        [Authorize]
        [HttpPost]
        public async Task<IActionResult>
            Create(
                [FromBody]
                ReviewDTO dto
            )
        {
            await _reviewService
                .Create(dto);

            return Ok(new
            {
                success = true,

                message =
                    "Review created successfully"
            });
        }

        /*
         * lấy review teacher
         */
        [HttpGet("{teacherId}")]
        public async Task<IActionResult>
            GetByTeacherId(
                int teacherId
            )
        {
            return Ok(
                await _reviewService
                    .GetByTeacherId(
                        teacherId
                    )
            );
        }

        /*
         * review theo booking
         */
        [Authorize]
        [HttpGet("booking/{bookingId}")]
        public async Task<IActionResult>
            GetByBookingId(
                int bookingId
            )
        {
            return Ok(
                await _reviewService
                    .GetByBookingId(
                        bookingId
                    )
            );
        }
    }
}