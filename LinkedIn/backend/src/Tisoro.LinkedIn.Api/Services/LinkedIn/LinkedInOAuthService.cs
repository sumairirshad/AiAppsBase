using System.Net.Http.Headers;
using System.Text.Json;
using System.Web;
using Microsoft.Extensions.Options;
using Tisoro.LinkedIn.Api.Configuration;

namespace Tisoro.LinkedIn.Api.Services.LinkedIn;

public interface ILinkedInOAuthService
{
    string BuildAuthorizeUrl(string state);
    Task<LinkedInTokenResponse> ExchangeCodeAsync(string code);
    Task<LinkedInUserInfo> GetUserInfoAsync(string accessToken);
    Task<IReadOnlyList<AdministeredOrganization>> GetAdministeredOrganizationsAsync(string accessToken);
}

/// <summary>
/// The 3-legged LinkedIn OAuth 2.0 flow used to connect the Tisoro Global
/// LinkedIn Page: an admin of the page signs in, grants the requested
/// scopes, and we resolve which organization(s) they administer so the
/// correct `urn:li:organization:*` is used as the post author going forward.
/// </summary>
public sealed class LinkedInOAuthService : ILinkedInOAuthService
{
    private readonly LinkedInOptions _options;
    private readonly HttpClient _http;
    private readonly ILogger<LinkedInOAuthService> _logger;

    public LinkedInOAuthService(IOptions<LinkedInOptions> options, IHttpClientFactory httpClientFactory, ILogger<LinkedInOAuthService> logger)
    {
        _options = options.Value;
        _http = httpClientFactory.CreateClient("LinkedIn");
        _logger = logger;
    }

    public string BuildAuthorizeUrl(string state)
    {
        var query = HttpUtility.ParseQueryString(string.Empty);
        query["response_type"] = "code";
        query["client_id"] = _options.ClientId;
        query["redirect_uri"] = _options.RedirectUri;
        query["state"] = state;
        query["scope"] = _options.Scopes;
        return $"{_options.AuthorizeBaseUrl}?{query}";
    }

    public async Task<LinkedInTokenResponse> ExchangeCodeAsync(string code)
    {
        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = _options.RedirectUri,
            ["client_id"] = _options.ClientId,
            ["client_secret"] = _options.ClientSecret,
        };

        using var response = await _http.PostAsync(_options.TokenUrl, new FormUrlEncodedContent(form));
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("LinkedIn token exchange failed: {Status} {Body}", (int)response.StatusCode, body);
            throw new LinkedInApiException($"LinkedIn token exchange failed with status {(int)response.StatusCode}.");
        }

        return JsonSerializer.Deserialize<LinkedInTokenResponse>(body)
            ?? throw new LinkedInApiException("LinkedIn token exchange returned an unparseable response.");
    }

    public async Task<LinkedInUserInfo> GetUserInfoAsync(string accessToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{_options.ApiBaseUrl}/v2/userinfo");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("LinkedIn userinfo request failed: {Status} {Body}", (int)response.StatusCode, body);
            throw new LinkedInApiException($"LinkedIn userinfo request failed with status {(int)response.StatusCode}.");
        }

        return JsonSerializer.Deserialize<LinkedInUserInfo>(body)
            ?? throw new LinkedInApiException("LinkedIn userinfo returned an unparseable response.");
    }

    public async Task<IReadOnlyList<AdministeredOrganization>> GetAdministeredOrganizationsAsync(string accessToken)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"{_options.ApiBaseUrl}/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED");
        ApplyStandardHeaders(request, accessToken);

        using var response = await _http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("LinkedIn organizationAcls request failed: {Status} {Body}", (int)response.StatusCode, body);
            throw new LinkedInApiException($"Could not list the organizations you administer (status {(int)response.StatusCode}).");
        }

        using var doc = JsonDocument.Parse(body);
        var results = new List<AdministeredOrganization>();
        if (doc.RootElement.TryGetProperty("elements", out var elements))
        {
            foreach (var element in elements.EnumerateArray())
            {
                if (element.TryGetProperty("organization", out var orgUrnProp))
                {
                    var orgUrn = orgUrnProp.GetString();
                    if (!string.IsNullOrEmpty(orgUrn))
                    {
                        results.Add(new AdministeredOrganization { OrganizationUrn = orgUrn });
                    }
                }
            }
        }

        foreach (var org in results)
        {
            org.OrganizationName = await TryGetOrganizationNameAsync(org.OrganizationUrn, accessToken);
        }

        return results;
    }

    private async Task<string?> TryGetOrganizationNameAsync(string organizationUrn, string accessToken)
    {
        // urn:li:organization:12345 -> 12345
        var id = organizationUrn.Split(':').LastOrDefault();
        if (string.IsNullOrEmpty(id)) return null;

        using var request = new HttpRequestMessage(HttpMethod.Get, $"{_options.ApiBaseUrl}/rest/organizations/{id}");
        ApplyStandardHeaders(request, accessToken);

        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode) return null;

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        if (doc.RootElement.TryGetProperty("localizedName", out var nameProp))
        {
            return nameProp.GetString();
        }
        return null;
    }

    private void ApplyStandardHeaders(HttpRequestMessage request, string accessToken)
    {
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Add("LinkedIn-Version", _options.ApiVersion);
        request.Headers.Add("X-Restli-Protocol-Version", "2.0.0");
    }
}

public sealed class LinkedInApiException : Exception
{
    public LinkedInApiException(string message) : base(message) { }
}
