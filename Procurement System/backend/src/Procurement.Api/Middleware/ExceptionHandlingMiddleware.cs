using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;

namespace Procurement.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
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
        catch (Exception ex)
        {
            await HandleAsync(context, ex);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title) = exception switch
        {
            NotFoundException => (HttpStatusCode.NotFound, "Not Found"),
            AuthenticationException => (HttpStatusCode.Unauthorized, "Unauthorized"),
            ForbiddenAccessException => (HttpStatusCode.Forbidden, "Forbidden"),
            ConflictException => (HttpStatusCode.Conflict, "Conflict"),
            BusinessRuleException => (HttpStatusCode.BadRequest, "Business Rule Violation"),
            FluentValidation.ValidationException => (HttpStatusCode.BadRequest, "Validation Failed"),
            DbUpdateConcurrencyException => (HttpStatusCode.Conflict, "Concurrency Conflict"),
            _ => (HttpStatusCode.InternalServerError, "Server Error"),
        };

        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception");
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        object payload = exception is FluentValidation.ValidationException validationException
            ? new { title, status = (int)statusCode, errors = validationException.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) }
            : new { title, status = (int)statusCode, detail = exception.Message };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
}
