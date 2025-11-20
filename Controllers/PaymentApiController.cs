using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;

using MyWebAPI.Utilities;

// using MyWebAPI.Services;

namespace MyWebAPI.Controllers
{
    [ApiController]
    [Route("payment")]
    public class PaymentController : ControllerBase
    {
        private readonly string _apiKey;
        private readonly IHttpClientFactory _clientFactory;
        private readonly ILogger<PaymentController> _paymentLogger;
        private readonly IMemoryCache _memoryCache;

        public PaymentController(
            IConfiguration configuration,
            IHttpClientFactory clientFactory,
            ILogger<PaymentController> paymentLogger,
            IMemoryCache memoryCache

        )
        {
            _clientFactory = clientFactory;
            _paymentLogger = paymentLogger;
            _memoryCache = memoryCache;
            _apiKey = configuration["MyAppSettings:ApiKey"] ?? throw new InvalidOperationException("API Key is not configured.");
            // _apiKey = "FaDMr6C75FG3WK76CR77R2A55cq9QG6J";
        }

        [HttpPost]
        public async Task<ActionResult<string>> SendPaymentRequest([FromForm] Dictionary<string, string> paymentRequest)
        {

            _paymentLogger.LogInformation("Received Payment Request with parameters: {PaymentRequest}", paymentRequest);

            // Create HttpClient instance
            var cacheKey = CacheKeyGenerator.GenerateCacheKey(paymentRequest);

            _paymentLogger.LogInformation("CacheKey generated: {CacheKey}", cacheKey);

            // Attempt to retrieve cached response
#pragma warning disable CS8600 // Converting null literal or possible null value to non-nullable type.
            if (_memoryCache.TryGetValue(cacheKey, out string cachedResponse))
            {
                _paymentLogger.LogInformation("Cache hit for key: {CacheKey}", cacheKey);
                return Ok(cachedResponse);
            }
#pragma warning restore CS8600 // Converting null literal or possible null value to non-nullable type.

            var httpClient = _clientFactory.CreateClient();

            Random rnd = new();

            paymentRequest["security_key"] = _apiKey;
            paymentRequest["order_id"] = "JasonTestNetOrder-" + rnd.Next();
            

            // Convert request data to URL-encoded form data
            var content = new FormUrlEncodedContent(paymentRequest);

            _paymentLogger.LogInformation("Payment Request:\n{PaymentRequest}", paymentRequest);
            try
            {
                var response = await httpClient.PostAsync("https://secure.networkmerchants.com/api/transact.php", content);
                response.EnsureSuccessStatusCode();
                var responseBody = await response.Content.ReadAsStringAsync();

                var prettyPrintedResponse = PrettyPrint.PrettyPrintResponse(responseBody);

                _paymentLogger.LogInformation("Payment Response:\n{PrettyResponse}", prettyPrintedResponse);

                return Ok(prettyPrintedResponse); // Return the pretty-printed response
            }
            catch (Exception ex)
            {
                _paymentLogger.LogError(ex, "Error sending payment request");
                return StatusCode(500, "Internal server error");
            }
        }


    }
}