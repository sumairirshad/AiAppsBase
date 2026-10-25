namespace TikTok.Api.Clients;

public class TikTokApiException : Exception
{
    public string? TikTokErrorCode { get; }
    public string? LogId { get; }

    public TikTokApiException(string message, string? tikTokErrorCode = null, string? logId = null) : base(message)
    {
        TikTokErrorCode = tikTokErrorCode;
        LogId = logId;
    }
}
