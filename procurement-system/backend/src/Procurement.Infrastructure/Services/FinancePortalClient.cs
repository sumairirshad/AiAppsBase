using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Infrastructure.Services;

public class FinancePortalClient : IFinancePortalClient
{
    private readonly HttpClient _http;
    private readonly IConfiguration _configuration;
    private readonly ILogger<FinancePortalClient> _logger;

    public FinancePortalClient(HttpClient http, IConfiguration configuration, ILogger<FinancePortalClient> logger)
    {
        _http = http;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task PushBillForwardedAsync(string payloadJson, CancellationToken ct = default)
    {
        var baseUrl = _configuration["FinancePortal:BaseUrl"];
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            _logger.LogInformation("FinancePortal push (no base URL configured): {Payload}", payloadJson);
            return;
        }

        using var content = new StringContent(payloadJson, Encoding.UTF8, "application/json");
        var response = await _http.PostAsync($"{baseUrl.TrimEnd('/')}/bills", content, ct);
        response.EnsureSuccessStatusCode();
    }
}
