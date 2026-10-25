namespace Instagram.Api.Clients;

public class InstagramApiException(string message, int? statusCode = null, string? errorType = null)
    : Exception(message)
{
    public int? StatusCode { get; } = statusCode;
    public string? ErrorType { get; } = errorType;
}
