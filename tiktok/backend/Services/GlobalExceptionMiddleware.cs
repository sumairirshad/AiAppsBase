using System.Net;
using System.Text.Json;
using TikTok.Api.Clients;
using TikTok.Api.Models.Dtos;

namespace TikTok.Api.Services;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
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
        catch (TikTokApiException ex)
        {
            _logger.LogError(ex, "TikTok API error. Code={Code} LogId={LogId}", ex.TikTokErrorCode, ex.LogId);
            await WriteErrorAsync(context, HttpStatusCode.BadGateway, "The TikTok API returned an error.", ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            await WriteErrorAsync(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception.");
            await WriteErrorAsync(context, HttpStatusCode.InternalServerError, "An unexpected error occurred.");
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, HttpStatusCode statusCode, string message, string? detail = null)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;
        var body = new ApiErrorResponse(message, detail);
        await context.Response.WriteAsync(JsonSerializer.Serialize(body));
    }
}
