using Backend.Common;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace Backend.Services
{
    public class StripeService
    {
        private readonly StripeConfig _config;

        public StripeService(
            IOptions<StripeConfig> config)
        {
            _config = config.Value;

            StripeConfiguration.ApiKey =
                _config.SecretKey;
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
                            ? $"http://localhost:4200/user/myclass?payment=success&paymentId={paymentId}"
                            : $"http://localhost:4200/my-bookings?payment=success&paymentId={paymentId}",

                        CancelUrl = refName == "CLASS"
                            ? $"http://localhost:4200/user/myclass?payment=cancel&paymentId={paymentId}"
                            : $"http://localhost:4200/my-bookings?payment=cancel&paymentId={paymentId}",

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