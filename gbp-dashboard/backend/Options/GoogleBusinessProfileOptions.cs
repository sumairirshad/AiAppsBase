namespace GbpDashboard.Api.Options;

public class GoogleBusinessProfileOptions
{
    public const string SectionName = "GoogleBusinessProfile";

    public bool UseRealApi { get; set; }
    public string ApiBaseUrl { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}
