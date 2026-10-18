using System.Text.Json;
using XDashboard.Api.Services.X;

namespace XDashboard.Api.Infrastructure;

/// <summary>
/// Translates exceptions from the real X API layer into structured JSON error responses, so the
/// frontend gets a real, specific message ("rate limited, retry in 42s", "connect your account
/// first", "X doesn't support editing posts") instead of a bare 500.
/// </summary>
public class ApiExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiExceptionMiddleware> _logger;

    public ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (XNotConnectedException ex)
        {
            await WriteAsync(context, StatusCodes.Status401Unauthorized, ex.Message, "not_connected");
        }
        catch (XFeatureNotSupportedException ex)
        {
            await WriteAsync(context, StatusCodes.Status409Conflict, ex.Message, "not_supported_by_x_api");
        }
        catch (XApiException ex)
        {
            _logger.LogWarning(ex, "X API call failed with status {StatusCode}", ex.StatusCode);
            var status = (int)ex.StatusCode is >= 400 and < 600 ? (int)ex.StatusCode : StatusCodes.Status502BadGateway;
            await WriteAsync(
                context,
                status,
                ex.Message,
                ex.IsRateLimited ? "rate_limited" : "x_api_error",
                ex.RetryAfterSeconds);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not configured"))
        {
            await WriteAsync(context, StatusCodes.Status503ServiceUnavailable, ex.Message, "x_not_configured");
        }
    }

    private static async Task WriteAsync(HttpContext context, int statusCode, string message, string code, int? retryAfterSeconds = null)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        var payload = new { message, code, retryAfterSeconds };
        await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
}
