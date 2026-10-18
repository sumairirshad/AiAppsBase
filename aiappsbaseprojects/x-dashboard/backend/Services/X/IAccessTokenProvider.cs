namespace XDashboard.Api.Services.X;

/// <summary>
/// Resolves a valid access token for the connected X account, transparently refreshing it
/// (and persisting the refreshed pair) when it is expired or about to expire.
/// </summary>
public interface IAccessTokenProvider
{
    /// <summary>Throws <see cref="XNotConnectedException"/> if no account is connected.</summary>
    Task<string> GetAccessTokenAsync(CancellationToken cancellationToken = default);

    Task<bool> IsConnectedAsync(CancellationToken cancellationToken = default);
}

public class AccessTokenProvider : IAccessTokenProvider
{
    private readonly ITokenStore _tokenStore;
    private readonly IXOAuthService _oAuthService;
    private readonly SemaphoreSlim _refreshLock = new(1, 1);

    public AccessTokenProvider(ITokenStore tokenStore, IXOAuthService oAuthService)
    {
        _tokenStore = tokenStore;
        _oAuthService = oAuthService;
    }

    public async Task<bool> IsConnectedAsync(CancellationToken cancellationToken = default)
    {
        var tokens = await _tokenStore.GetAsync(cancellationToken);
        return tokens is not null;
    }

    public async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken = default)
    {
        var tokens = await _tokenStore.GetAsync(cancellationToken)
            ?? throw new XNotConnectedException();

        if (!tokens.NeedsRefresh)
        {
            return tokens.AccessToken;
        }

        if (string.IsNullOrEmpty(tokens.RefreshToken))
        {
            // No refresh token (offline.access was not granted, or it's already been used up)
            // -- the connection has to be re-established via the OAuth flow.
            await _tokenStore.ClearAsync(cancellationToken);
            throw new XNotConnectedException();
        }

        await _refreshLock.WaitAsync(cancellationToken);
        try
        {
            // Re-read in case another request already refreshed while we waited for the lock.
            tokens = await _tokenStore.GetAsync(cancellationToken) ?? throw new XNotConnectedException();
            if (!tokens.NeedsRefresh)
            {
                return tokens.AccessToken;
            }

            var refreshed = await _oAuthService.RefreshAsync(tokens.RefreshToken!, cancellationToken);
            await _tokenStore.SaveAsync(refreshed, cancellationToken);
            return refreshed.AccessToken;
        }
        finally
        {
            _refreshLock.Release();
        }
    }
}
