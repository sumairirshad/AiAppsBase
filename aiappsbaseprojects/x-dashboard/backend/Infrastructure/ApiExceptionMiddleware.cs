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
        catch (Exception ex)
        {
            // A genuinely unexpected failure (a bug, a dependency throwing something this app
            // doesn't have a typed exception for, etc). Without this, the response would be a
            // bare, bodyless 500 that the frontend's ApiErrorState can't parse a message out of,
            // and the specific failure would only be visible by reading server logs after the
            // fact instead of the structured error every other failure path already returns.
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            if (!context.Response.HasStarted)
            {
                await WriteAsync(context, StatusCodes.Status500InternalServerError, "An unexpected error occurred.", "internal_error");
            }
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
