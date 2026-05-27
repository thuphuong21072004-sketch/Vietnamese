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

        public PaymentController(
            PaymentService paymentService)
        {
            _paymentService =
                paymentService;
        }

        /*
         * create payment
         */
        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult>
        Create(
            [FromBody] PaymentDTO dto)
        {
            var payment =
                await _paymentService
                    .Create(dto);

            return Ok(payment);
        }

        /*
         * create vnpay url
         */
        [Authorize]
        [HttpPost("{paymentId}/vnpay")]
        public async Task<IActionResult> VNPay(int paymentId)
        {
            try
            {
                var url =
                    await _paymentService
                        .CreateVNPayUrl(
                            paymentId);

                return Ok(new
                {
                    success = true,
                    paymentUrl = url
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    detail = ex.ToString()
                });
            }
        }

        /*
         * vnpay callback
         */
        [AllowAnonymous]
        [HttpGet("vnpay-return")]
        public async Task<IActionResult>
        VNPayReturn()
        {
            var responseCode =
                Request.Query["vnp_ResponseCode"]
                    .ToString();

            var txnRef =
                Request.Query["vnp_TxnRef"]
                    .ToString();

            var transactionNo =
                Request.Query["vnp_TransactionNo"]
                    .ToString();

            /*
             * payment id
             */
            int paymentId =
                int.Parse(txnRef);

            /*
             * success
             */
            if (responseCode == "00")
            {
                await _paymentService
                    .Success(
                        paymentId,
                        transactionNo);

                /*
                 * redirect frontend
                 */
                return Redirect(
    "http://localhost:4200/my-bookings");
            }

            /*
             * failed
             */
            await _paymentService
                .Failed(paymentId);

            return Redirect(
    "http://localhost:4200/my-bookings");
        }

        /*
         * payment by booking
         */
        [Authorize]
        [HttpGet("booking/{bookingId}")]
        public async Task<IActionResult>
        GetByBooking(int bookingId)
        {
            return Ok(
                await _paymentService
                    .GetByBooking(
                        bookingId));
        }
    }
}