using System.Net;

namespace Instagram.Api.Clients;

public class RetryHandler(ILogger<RetryHandler> logger) : DelegatingHandler
{
    private const int MaxAttempts = 3;
    private static readonly HttpStatusCode[] RetryableStatusCodes =
    [
        HttpStatusCode.TooManyRequests,
        HttpStatusCode.InternalServerError,
        HttpStatusCode.BadGateway,
        HttpStatusCode.ServiceUnavailable,
        HttpStatusCode.GatewayTimeout
    ];

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        HttpResponseMessage? response = null;

        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            response?.Dispose();
            response = await base.SendAsync(request, cancellationToken);

            if (!RetryableStatusCodes.Contains(response.StatusCode) || attempt == MaxAttempts)
            {
                return response;
            }

            var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
            logger.LogWarning(
                "Instagram API call to {Uri} returned {StatusCode}, retrying in {Delay}s (attempt {Attempt}/{MaxAttempts})",
                request.RequestUri, response.StatusCode, delay.TotalSeconds, attempt, MaxAttempts);
            await Task.Delay(delay, cancellationToken);
        }

        return response!;
    }
}
