using Backend.Common;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using System.Web;

namespace Backend.Services
{
    public class VNPayService
    {
        private readonly VNPayConfig _config;

        public VNPayService(IOptions<VNPayConfig> config)
        {
            _config = config.Value;
        }

        public string CreatePaymentUrl(int paymentId, decimal amount, string ipAddress)
        {
            var createDate = DateTime.Now.ToString("yyyyMMddHHmmss");
            decimal usdToVnd = 25000m;
            long vnpAmount = (long)(amount * usdToVnd * 100);

            var vnpParams = new SortedDictionary<string, string>
            {
                { "vnp_Amount", vnpAmount.ToString() },
                { "vnp_BankCode", "NCB" },
                { "vnp_Command", "pay" },
                { "vnp_CreateDate", createDate },
                { "vnp_CurrCode", "VND" },
                { "vnp_IpAddr", ipAddress },
                { "vnp_Locale", "vn" },
                { "vnp_OrderInfo", $"Thanh toan booking {paymentId}" },
                { "vnp_OrderType", "other" },
                { "vnp_ReturnUrl", _config.ReturnUrl },
                { "vnp_TmnCode", _config.TmnCode },
                { "vnp_TxnRef", paymentId.ToString() },
                { "vnp_Version", "2.0.0" }
            };

            var hashData = new StringBuilder();
            var query = new StringBuilder();

            foreach (var item in vnpParams)
            {
                if (!string.IsNullOrEmpty(item.Value))
                {
                    hashData.Append($"{item.Key}={item.Value}&");
                    query.Append($"{item.Key}={HttpUtility.UrlEncode(item.Value)}&");
                }
            }

            var rawData = hashData.ToString().TrimEnd('&');
            var queryUrl = query.ToString().TrimEnd('&');

            Console.WriteLine("RAW DATA:");
            Console.WriteLine(rawData);

            Console.WriteLine("SECRET:");
            Console.WriteLine(_config.HashSecret);

            var secureHash = HmacSHA512(_config.HashSecret, rawData);

            var finalUrl = $"{_config.BaseUrl}?{queryUrl}&vnp_SecureHashType=HmacSHA256&vnp_SecureHash={secureHash}";

            Console.WriteLine("RAW DATA:");
            Console.WriteLine(rawData);

            Console.WriteLine("FINAL URL:");
            Console.WriteLine(finalUrl);

            return finalUrl;
        }

        private string HmacSHA512(string key, string inputData)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var inputBytes = Encoding.UTF8.GetBytes(inputData);

            using var hmac = new HMACSHA512(keyBytes);
            var hashValue = hmac.ComputeHash(inputBytes);

            return BitConverter.ToString(hashValue).Replace("-", "").ToLower();
        }
    }
}