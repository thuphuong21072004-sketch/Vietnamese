using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _paymentService;

        public PaymentController(PaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        /* 
         * tạo payment
         * O(1)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] PaymentDTO dto)
        {
            return Ok(await _paymentService.Create(dto));
        }

        /* 
         * payment success callback
         * O(1)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpPut("{paymentId}/success")]
        public async Task<IActionResult> Success(int paymentId, [FromQuery] string transactionCode)
        {
            await _paymentService.Success(paymentId, transactionCode);

            return Ok(new
            {
                success = true,
                message = "Payment success"
            });
        }

        /* 
         * payment failed
         * O(1)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpPut("{paymentId}/failed")]
        public async Task<IActionResult> Failed(int paymentId)
        {
            await _paymentService.Failed(paymentId);

            return Ok(new
            {
                success = true,
                message = "Payment failed"
            });
        }

        /* 
         * payment theo booking
         * O(1)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpGet("booking/{bookingId}")]
        public async Task<IActionResult> GetByBooking(int bookingId)
        {
            return Ok(await _paymentService.GetByBooking(bookingId));
        }
    }
}