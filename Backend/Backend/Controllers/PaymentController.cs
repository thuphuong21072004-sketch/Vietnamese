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

        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] PaymentDTO dto)
        {
            var payment = await _paymentService.Create(dto);
            return Ok(payment);
        }

        [Authorize]
        [HttpPost("{paymentId}/vnpay")]
        public async Task<IActionResult> VNPay(int paymentId)
        {
            try
            {
                var url = await _paymentService.CreateVNPayUrl(paymentId);
                return Ok(new { success = true, paymentUrl = url });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, detail = ex.ToString() });
            }
        }

        [AllowAnonymous]
        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VNPayReturn()
        {
            var responseCode = Request.Query["vnp_ResponseCode"].ToString();
            var txnRef = Request.Query["vnp_TxnRef"].ToString();
            var transactionNo = Request.Query["vnp_TransactionNo"].ToString();

            int paymentId = int.Parse(txnRef);

            if (responseCode == "00")
            {
                await _paymentService.Success(paymentId, transactionNo);
                return Redirect("http://localhost:4200/my-bookings");
            }

            await _paymentService.Failed(paymentId);
            return Redirect("http://localhost:4200/my-bookings");
        }

        [Authorize]
        [HttpGet("booking/{bookingId}")]
        public async Task<IActionResult> GetByBooking(int bookingId)
        {
            return Ok(await _paymentService.GetByBooking(bookingId));
        }


        [Authorize]
        [HttpGet("me/statistics")]
        public async Task<IActionResult> GetMyStatistics([FromQuery] int month, [FromQuery] int year)
        {
            return Ok(await _paymentService.GetMyStatistics(month, year));
        }

        [Authorize]
        [HttpGet("me/payments")]
        public async Task<IActionResult> GetMyPayments([FromQuery] int month, [FromQuery] int year, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            return Ok(await _paymentService.GetMyPaymentHistory(month, year, page, pageSize));
        }

        [Authorize]
        [HttpGet("teacher/salary-statistics")]
        public async Task<IActionResult> GetMySalaryStatistics([FromQuery] int month, [FromQuery] int year)
        {
            return Ok(await _paymentService.GetMySalaryStatistics(month, year));
        }
        [Authorize]
        [HttpGet("teacher/salary-history")]
        public async Task<IActionResult> GetMySalaryHistory([FromQuery] int month, [FromQuery] int year, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            return Ok(await _paymentService.GetMySalaryHistory(month, year, page, pageSize));
        }

        [Authorize]
        [HttpGet("admin/finance-overview")]
        public async Task<IActionResult> GetAdminFinanceOverview([FromQuery] int month, [FromQuery] int year)
        {
            return Ok(await _paymentService.GetAdminFinanceOverview(month, year));
        }
        [Authorize]
        [HttpGet("admin/student-finance")]
        public async Task<IActionResult> GetStudentFinanceReport([FromQuery] int month, [FromQuery] int year, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            return Ok(await _paymentService.GetStudentFinanceReport(month, year, page, pageSize));
        }
        [Authorize]
        [HttpGet("admin/teacher-finance")]
        public async Task<IActionResult> GetTeacherFinanceReport([FromQuery] int month, [FromQuery] int year, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            return Ok(await _paymentService.GetTeacherFinanceReport(month, year, page, pageSize));
        }
    }
}