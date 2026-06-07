using Backend.Common;
using Backend.Common;
using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;
using static Backend.common.Constant;

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
        [HttpGet("{refName}/{refId}")]
        public async Task<IActionResult> GetByRef(
    string refName,
    int refId)
        {
            return Ok(
                await _paymentService.GetByRef(
                    refName,
                    refId));
        }
    }
}