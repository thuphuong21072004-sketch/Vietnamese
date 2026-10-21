using Backend.Common;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace Backend.Services
{
    public class StripeService
    {
        private readonly StripeConfig _config;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IConfiguration _configuration;

        public StripeService(
            IOptions<StripeConfig> config,
            IHttpContextAccessor httpContextAccessor,
            IConfiguration configuration)
        {
            _config = config.Value;
            _httpContextAccessor = httpContextAccessor;
            _configuration = configuration;

            StripeConfiguration.ApiKey =
                _config.SecretKey;
        }

        // Địa chỉ giao diện người dùng đang mở (localhost:4200, link tunnel, domain thật)
        // để Stripe trả về đúng chỗ sau khi thanh toán.
        private string GetFrontendBaseUrl()
        {
            var headers = _httpContextAccessor.HttpContext?.Request.Headers;

            foreach (var candidate in new[] { headers?.Origin.ToString(), headers?.Referer.ToString() })
            {
                if (Uri.TryCreate(candidate, UriKind.Absolute, out var uri)
                    && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
                    return uri.GetLeftPart(UriPartial.Authority);
            }

            return (_configuration["App:FrontendUrl"] ?? "http://localhost:4200").TrimEnd('/');
        }

        private long ConvertToStripeAmount(
            decimal amount,
            string currency)
        {
            return (long)Math.Round(amount*100);
        }

        public string CreateCheckoutSession(
     int paymentId,
     decimal amount,
     string currency,
     string refName = "PrivateLesson")
        {
            try
            {
                currency = currency.ToUpper();
                var frontendUrl = GetFrontendBaseUrl();

                var options =
                    new SessionCreateOptions
                    {
                        Metadata =
                            new Dictionary<string, string>
                            {
                        {
                            "PaymentId",
                            paymentId.ToString()
                        }
                            },

                        Mode = "payment",

                        SuccessUrl = refName == "CLASS"
                            ? $"{frontendUrl}/user/myclass?payment=success&paymentId={paymentId}"
                            : $"{frontendUrl}/my-bookings?payment=success&paymentId={paymentId}",

                        CancelUrl = refName == "CLASS"
                            ? $"{frontendUrl}/user/myclass?payment=cancel&paymentId={paymentId}"
                            : $"{frontendUrl}/my-bookings?payment=cancel&paymentId={paymentId}",

                        LineItems =
                        [
                            new SessionLineItemOptions
                    {
                        Quantity = 1,

                        PriceData =
                            new SessionLineItemPriceDataOptions
                            {
                                Currency =
                                    currency.ToLower(),

                                UnitAmount =
                                    ConvertToStripeAmount(
                                        amount,
                                        currency),

                                ProductData =
                                    new SessionLineItemPriceDataProductDataOptions
                                    {
                                        Name =
    "Vietnamese Language Lesson",

Description =
    "Private online Vietnamese class with certified teacher"
                                    }
                            }
                    }
                        ]
                    };

                var service =
                    new SessionService();

                var session =
                    service.Create(options);

                return session.Url!;
            }
            catch (StripeException ex)
            {
                throw new Exception(
                    $"Stripe Error: {ex.StripeError?.Message}");
            }
        }
    }
}