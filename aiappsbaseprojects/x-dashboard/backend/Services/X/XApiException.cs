using System.Net;

namespace XDashboard.Api.Services.X;

/// <summary>
/// Raised whenever a call to the real X API fails. Carries enough detail for the controller
/// layer to return a meaningful error to the frontend instead of a generic 500, and enough for
/// callers to distinguish "not connected", "rate limited", and genuine API errors.
/// </summary>
public class XApiException : Exception
{
    public HttpStatusCode StatusCode { get; }
    public string? XErrorDetail { get; }
    public bool IsRateLimited { get; }
    public int? RetryAfterSeconds { get; }

    public XApiException(
        HttpStatusCode statusCode,
        string message,
        string? xErrorDetail = null,
        bool isRateLimited = false,
        int? retryAfterSeconds = null)
        : base(message)
    {
        StatusCode = statusCode;
        XErrorDetail = xErrorDetail;
        IsRateLimited = isRateLimited;
        RetryAfterSeconds = retryAfterSeconds;
    }
}

/// <summary>
/// Raised when an operation needs an X account connected via OAuth but none is connected yet.
/// </summary>
public class XNotConnectedException : Exception
{
    public XNotConnectedException()
        : base("No X account is connected. Connect your X account before using this feature.")
    {
    }
}

/// <summary>
/// Raised when a UI feature has no supported real X API endpoint behind it (e.g. editing a
/// published post's text, or setting a professional account category). Mapped to HTTP 409 so the
/// frontend can show the real limitation instead of a generic failure.
/// </summary>
public class XFeatureNotSupportedException : Exception
{
    public XFeatureNotSupportedException(string message) : base(message)
    {
    }
}
