using System.Text.Json;

namespace Backend.Services
{
    public class ExchangeRateService
    {
        private readonly HttpClient _httpClient;

        public ExchangeRateService(
            HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<Dictionary<string, decimal>>
            GetAllCurrencies(decimal usdAmount)
        {
            var json =
                await _httpClient.GetStringAsync(
                    "https://open.er-api.com/v6/latest/USD");

            using var doc =
                JsonDocument.Parse(json);

            var rates =
                doc.RootElement
                    .GetProperty("rates");

            var result =
                new Dictionary<string, decimal>();

            foreach (
                var rate in rates.EnumerateObject())
            {
                result[rate.Name] =
                    Math.Round(
                        usdAmount *
                        rate.Value.GetDecimal(),
                        2);
            }

            return result;
        }

        public async Task<decimal>
            ConvertFromUsd(
                decimal usdAmount,
                string currency)
        {
            var all =
                await GetAllCurrencies(
                    usdAmount);

            currency =
                currency.ToUpper();

            if (!all.ContainsKey(currency))
            {
                throw new Exception(
                    $"Currency {currency} not found");
            }

            return all[currency];
        }
    }
}