using Instagram.Api.Clients;
using Instagram.Api.Data;
using Instagram.Api.Entities;
using Instagram.Api.Models.Dtos;
using Instagram.Api.Security;
using Microsoft.EntityFrameworkCore;

namespace Instagram.Api.Services;

public class AccountService(
    InstagramDbContext db,
    IInstagramGraphClient graphClient,
    ITokenProtector tokenProtector,
    ILogger<AccountService> logger) : IAccountService
{
    public async Task<IReadOnlyList<AccountDto>> GetAccountsAsync(CancellationToken ct)
    {
        var accounts = await db.ConnectedAccounts.AsNoTracking().OrderBy(a => a.ConnectedAt).ToListAsync(ct);
        return accounts.Select(ToDto).ToList();
    }

    public async Task<AccountDto?> GetAccountAsync(Guid id, CancellationToken ct)
    {
        var account = await db.ConnectedAccounts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, ct);
        return account is null ? null : ToDto(account);
    }

    public async Task<AccountDto> CompleteConnectionAsync(string authorizationCode, string codeVerifier, CancellationToken ct)
    {
        var shortLived = await graphClient.ExchangeCodeForShortLivedTokenAsync(authorizationCode, ct);
        var longLived = await graphClient.ExchangeForLongLivedTokenAsync(shortLived.AccessToken, ct);
        var profile = await graphClient.GetProfileAsync(longLived.AccessToken, ct);

        var existing = await db.ConnectedAccounts
            .FirstOrDefaultAsync(a => a.PlatformUserId == profile.UserId, ct);

        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.AddSeconds(longLived.ExpiresInSeconds);
        var encryptedToken = tokenProtector.Protect(longLived.AccessToken);

        if (existing is null)
        {
            existing = new ConnectedAccount
            {
                Id = Guid.NewGuid(),
                PlatformUserId = profile.UserId,
                Username = profile.Username,
                EncryptedAccessToken = encryptedToken,
                GrantedScopes = string.Empty,
                ConnectedAt = now,
                UpdatedAt = now,
                TokenExpiresAt = expiresAt
            };
            db.ConnectedAccounts.Add(existing);
        }

        existing.DisplayName = profile.Name;
        existing.ProfilePictureUrl = profile.ProfilePictureUrl;
        existing.AccountType = profile.AccountType;
        existing.Biography = profile.Biography;
        existing.Website = profile.Website;
        existing.FollowersCount = profile.FollowersCount;
        existing.MediaCount = profile.MediaCount;
        existing.EncryptedAccessToken = encryptedToken;
        existing.TokenExpiresAt = expiresAt;
        existing.IsActive = true;
        existing.UpdatedAt = now;

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Instagram account {Username} connected/refreshed.", existing.Username);

        return ToDto(existing);
    }

    public async Task DisconnectAsync(Guid id, CancellationToken ct)
    {
        var account = await db.ConnectedAccounts.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (account is null) return;

        account.IsActive = false;
        account.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public async Task<string> GetDecryptedAccessTokenAsync(Guid accountId, CancellationToken ct)
    {
        var account = await db.ConnectedAccounts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == accountId, ct)
            ?? throw new KeyNotFoundException($"Connected account {accountId} was not found.");

        if (account.TokenExpiresAt < DateTimeOffset.UtcNow.AddDays(1))
        {
            await RefreshTokenAsync(account, ct);
            account = await db.ConnectedAccounts.AsNoTracking().FirstAsync(a => a.Id == accountId, ct);
        }

        return tokenProtector.Unprotect(account.EncryptedAccessToken);
    }

    private async Task RefreshTokenAsync(ConnectedAccount account, CancellationToken ct)
    {
        var currentToken = tokenProtector.Unprotect(account.EncryptedAccessToken);
        var refreshed = await graphClient.RefreshLongLivedTokenAsync(currentToken, ct);

        var tracked = await db.ConnectedAccounts.FirstAsync(a => a.Id == account.Id, ct);
        tracked.EncryptedAccessToken = tokenProtector.Protect(refreshed.AccessToken);
        tracked.TokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(refreshed.ExpiresInSeconds);
        tracked.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Refreshed Instagram long-lived token for account {AccountId}.", account.Id);
    }

    private static AccountDto ToDto(ConnectedAccount a) => new(
        a.Id, a.PlatformUserId, a.Username, a.DisplayName, a.ProfilePictureUrl, a.AccountType,
        a.Biography, a.Website, a.FollowersCount, a.MediaCount, a.TokenExpiresAt, a.ConnectedAt, a.IsActive);
}
