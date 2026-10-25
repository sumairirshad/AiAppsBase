using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TikTok.Api.Clients;
using TikTok.Api.Configuration;
using TikTok.Api.Data;
using TikTok.Api.Entities;
using TikTok.Api.Models.Dtos;
using TikTok.Api.Security;

namespace TikTok.Api.Services;

public class AccountConnectionService : IAccountConnectionService
{
    private readonly TikTokDbContext _db;
    private readonly ITikTokApiClient _client;
    private readonly ITokenProtector _tokenProtector;
    private readonly IOAuthStateStore _stateStore;
    private readonly TikTokOptions _options;
    private readonly ILogger<AccountConnectionService> _logger;

    public AccountConnectionService(
        TikTokDbContext db,
        ITikTokApiClient client,
        ITokenProtector tokenProtector,
        IOAuthStateStore stateStore,
        IOptions<TikTokOptions> options,
        ILogger<AccountConnectionService> logger)
    {
        _db = db;
        _client = client;
        _tokenProtector = tokenProtector;
        _stateStore = stateStore;
        _options = options.Value;
        _logger = logger;
    }

    public string BuildAuthorizationUrl(out string state)
    {
        var pkce = PkceGenerator.Generate();
        state = _stateStore.CreateState(pkce.CodeVerifier);

        var query = new Dictionary<string, string>
        {
            ["client_key"] = _options.ClientKey,
            ["response_type"] = "code",
            ["scope"] = _options.Scopes,
            ["redirect_uri"] = _options.RedirectUri,
            ["state"] = state,
            ["code_challenge"] = pkce.CodeChallenge,
            ["code_challenge_method"] = "S256"
        };

        var queryString = string.Join("&", query.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));
        return $"{_options.AuthorizeUrl}?{queryString}";
    }

    public async Task<ConnectedAccount> HandleCallbackAsync(string code, string state, CancellationToken ct)
    {
        if (!_stateStore.TryConsume(state, out var codeVerifier))
        {
            throw new InvalidOperationException("The OAuth state is invalid, expired, or was already used.");
        }

        var tokenResponse = await _client.ExchangeCodeForTokenAsync(code, codeVerifier, ct);
        var userInfo = await _client.GetUserInfoAsync(tokenResponse.AccessToken, ct);

        var now = DateTimeOffset.UtcNow;
        var account = await _db.ConnectedAccounts.FirstOrDefaultAsync(a => a.OpenId == tokenResponse.OpenId, ct);

        if (account is null)
        {
            account = new ConnectedAccount
            {
                Id = Guid.NewGuid(),
                OpenId = tokenResponse.OpenId,
                ConnectedAt = now
            };
            _db.ConnectedAccounts.Add(account);
        }

        account.Username = userInfo.Username ?? userInfo.DisplayName;
        account.DisplayName = userInfo.DisplayName;
        account.AvatarUrl = userInfo.AvatarUrl;
        account.BioDescription = userInfo.BioDescription;
        account.IsVerified = userInfo.IsVerified;
        account.FollowerCount = userInfo.FollowerCount;
        account.FollowingCount = userInfo.FollowingCount;
        account.LikesCount = userInfo.LikesCount;
        account.VideoCount = userInfo.VideoCount;
        account.EncryptedAccessToken = _tokenProtector.Protect(tokenResponse.AccessToken);
        account.EncryptedRefreshToken = _tokenProtector.Protect(tokenResponse.RefreshToken);
        account.AccessTokenExpiresAt = now.AddSeconds(tokenResponse.ExpiresIn);
        account.RefreshTokenExpiresAt = now.AddSeconds(tokenResponse.RefreshExpiresIn);
        account.GrantedScopes = tokenResponse.Scope;
        account.IsActive = true;
        account.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
        return account;
    }

    public async Task<IReadOnlyList<ConnectedAccountDto>> ListAccountsAsync(CancellationToken ct)
    {
        return await _db.ConnectedAccounts
            .OrderByDescending(a => a.ConnectedAt)
            .Select(a => new ConnectedAccountDto(
                a.Id,
                a.Username,
                a.DisplayName,
                a.AvatarUrl,
                a.BioDescription,
                a.IsVerified,
                a.FollowerCount,
                a.VideoCount,
                a.GrantedScopes,
                a.IsActive,
                a.ConnectedAt,
                a.AccessTokenExpiresAt))
            .ToListAsync(ct);
    }

    public async Task DisconnectAsync(Guid accountId, CancellationToken ct)
    {
        var account = await _db.ConnectedAccounts.FirstOrDefaultAsync(a => a.Id == accountId, ct);
        if (account is null)
        {
            return;
        }

        account.IsActive = false;
        account.EncryptedAccessToken = string.Empty;
        account.EncryptedRefreshToken = string.Empty;
        account.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<string> GetValidAccessTokenAsync(ConnectedAccount account, CancellationToken ct)
    {
        if (account.AccessTokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(2))
        {
            return _tokenProtector.Unprotect(account.EncryptedAccessToken);
        }

        if (account.RefreshTokenExpiresAt <= DateTimeOffset.UtcNow)
        {
            throw new InvalidOperationException("The TikTok refresh token has expired. The account must be reconnected.");
        }

        var refreshToken = _tokenProtector.Unprotect(account.EncryptedRefreshToken);
        var tokenResponse = await _client.RefreshTokenAsync(refreshToken, ct);

        var now = DateTimeOffset.UtcNow;
        account.EncryptedAccessToken = _tokenProtector.Protect(tokenResponse.AccessToken);
        account.EncryptedRefreshToken = _tokenProtector.Protect(tokenResponse.RefreshToken);
        account.AccessTokenExpiresAt = now.AddSeconds(tokenResponse.ExpiresIn);
        account.RefreshTokenExpiresAt = now.AddSeconds(tokenResponse.RefreshExpiresIn);
        account.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Refreshed TikTok access token for account {AccountId}.", account.Id);
        return tokenResponse.AccessToken;
    }
}
