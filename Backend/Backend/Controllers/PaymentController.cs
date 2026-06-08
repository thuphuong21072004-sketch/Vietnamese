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
        private readonly Backend.Common.BankConfig _bankConfig;

        public PaymentController(PaymentService paymentService, ExchangeRateService exchangeRateService, IOptions<StripeConfig> stripeConfig, IOptions<Backend.Common.BankConfig> bankConfig)
        {
            _paymentService = paymentService;
            _exchangeRateService = exchangeRateService;
            _stripeConfig= stripeConfig.Value;
            _bankConfig = bankConfig.Value;
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

        [Authorize(Roles = "Admin,Moderator")]
        [HttpGet("bank-transfers")]
        public async Task<IActionResult> GetPendingBankTransfers()
        {
            return Ok(await _paymentService.GetPendingBankTransfers());
        }

        [Authorize(Roles = "Admin,Moderator")]
        [HttpPost("{paymentId}/confirm")]
        public async Task<IActionResult> ConfirmBankTransfer(int paymentId)
        {
            await _paymentService.ConfirmBankTransfer(paymentId);
            return Ok(new { success = true });
        }

        [HttpGet("bank-info")]
        public async Task<IActionResult> GetBankInfo([FromQuery] decimal amount = 0)
        {
            decimal vndAmount = 0;
            if (amount > 0)
            {
                try
                {
                    vndAmount = await _exchangeRateService.ConvertFromUsd(amount, "VND");
                }
                catch
                {
                    vndAmount = Math.Round(amount * 25000, 0);
                }
            }

            return Ok(new
            {
                bankId = _bankConfig.BankId,
                accountNo = _bankConfig.AccountNo,
                accountName = _bankConfig.AccountName,
                note = _bankConfig.Note,
                vndAmount
            });
        }

        [Authorize]
        [HttpPost("bank-transfer")]
        public async Task<IActionResult> BankTransfer([FromBody] PaymentDTO dto)
        {
            await _paymentService.BankTransfer(dto);
            return Ok(new { success = true });
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