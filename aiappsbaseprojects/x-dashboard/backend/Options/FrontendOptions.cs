namespace XDashboard.Api.Options;

/// <summary>
/// Where to send the browser back to after the X OAuth callback completes.
/// </summary>
public class FrontendOptions
{
    public const string SectionName = "Frontend";

    public string BaseUrl { get; set; } = "http://localhost:3000";
}
