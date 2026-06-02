using Backend.Common;
using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;
using Stripe.Checkout;
using Backend.Common;
using Microsoft.Extensions.Options;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _paymentService;
        private readonly ExchangeRateService _exchangeRateService;
        private readonly StripeConfig _stripeConfig;

        public PaymentController(PaymentService paymentService, ExchangeRateService exchangeRateService, IOptions<StripeConfig> stripeConfig)
        {
            _paymentService = paymentService;
            _exchangeRateService = exchangeRateService;
            _stripeConfig= stripeConfig.Value;
        }

        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] PaymentDTO dto)
        {
            var payment = await _paymentService.Create(dto);
            return Ok(payment);
        }

        
        [Authorize]
        [HttpGet("currencies")]
        public async Task<IActionResult> GetCurrencies(
    [FromQuery] decimal amount)
        {
            return Ok(
                await _exchangeRateService
                    .GetAllCurrencies(amount));
        }
       
        [Authorize]
        [HttpPost("{paymentId}/stripe")]
        public async Task<IActionResult> CreateStripeUrl(
    int paymentId,
    string currency)
        {
            try
            {
                var url =
                    await _paymentService
                        .CreateStripeUrl(
                            paymentId,
                            currency);

                return Ok(new
                {
                    paymentUrl = url
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    stack = ex.StackTrace
                });
            }
        }

        [AllowAnonymous]
        [HttpPost("stripe-webhook")]
        public async Task<IActionResult> StripeWebhook()
        {
            var json =
                await new StreamReader(
                    Request.Body)
                .ReadToEndAsync();

            var stripeSignature =
                Request.Headers["Stripe-Signature"];

            Event stripeEvent;

            try
            {
                stripeEvent =
                    EventUtility.ConstructEvent(
                        json,
                        stripeSignature,
                        _stripeConfig.WebhookSecret);

                Console.WriteLine(
                    $"Webhook received: {stripeEvent.Type}");
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Webhook Error: {ex.Message}");

                return BadRequest();
            }

            if (
                stripeEvent.Type ==
                "checkout.session.completed")
            {
                var session =
                    stripeEvent.Data.Object
                    as Session;

                Console.WriteLine(
                    $"Checkout completed");

                if (
                    session == null ||
                    session.Metadata == null ||
                    !session.Metadata.ContainsKey(
                        "PaymentId"))
                {
                    Console.WriteLine(
                        "PaymentId not found");

                    return BadRequest();
                }

                int paymentId =
                    int.Parse(
                        session.Metadata["PaymentId"]);

                Console.WriteLine(
                    $"PaymentId = {paymentId}");

                await _paymentService.Success(
                    paymentId,
                    session.PaymentIntentId
                    ?? session.Id);

                Console.WriteLine(
                    $"SUCCESS PAYMENT {paymentId}");
            }

            return Ok();
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