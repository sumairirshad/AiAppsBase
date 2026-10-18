namespace XDashboard.Api.Services.X;

/// <summary>
/// Server-side storage for the connected X account's OAuth tokens. This dashboard represents a
/// single X account, so there is one slot ("primary") rather than a per-browser-session table.
/// Tokens are encrypted at rest (see EncryptedInMemoryTokenStore) and are NEVER sent to the
/// browser. This phase keeps the store in-memory for the same reason the rest of the backend's
/// data stores are in-memory (see README): restarting the backend requires reconnecting. The
/// interface is intentionally storage-agnostic so a persistent, encrypted-at-rest database table
/// can be swapped in later without touching callers.
/// </summary>
public interface ITokenStore
{
    Task<XTokenSet?> GetAsync(CancellationToken cancellationToken = default);
    Task SaveAsync(XTokenSet tokens, CancellationToken cancellationToken = default);
    Task ClearAsync(CancellationToken cancellationToken = default);
}
