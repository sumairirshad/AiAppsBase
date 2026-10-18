namespace XDashboard.Api.Services.X;

/// <summary>
/// The transient PKCE state held between redirecting the browser to X's authorize endpoint and
/// it coming back to our callback. Keyed by the random `state` value sent in the authorize URL.
/// </summary>
public class PendingAuthorization
{
    public required string State { get; init; }
    public required string CodeVerifier { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public interface IPendingAuthorizationStore
{
    void Add(PendingAuthorization authorization);

    /// <summary>Removes and returns the pending authorization for this state, or null if it
    /// does not exist or has expired (replay/CSRF protection: each state is usable once).</summary>
    PendingAuthorization? TakeByState(string state);
}

public class InMemoryPendingAuthorizationStore : IPendingAuthorizationStore
{
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(10);
    private readonly object _lock = new();
    private readonly Dictionary<string, PendingAuthorization> _pending = new();

    public void Add(PendingAuthorization authorization)
    {
        lock (_lock)
        {
            PruneExpired();
            _pending[authorization.State] = authorization;
        }
    }

    public PendingAuthorization? TakeByState(string state)
    {
        lock (_lock)
        {
            PruneExpired();
            if (!_pending.TryGetValue(state, out var found))
            {
                return null;
            }

            _pending.Remove(state);
            return found;
        }
    }

    private void PruneExpired()
    {
        var cutoff = DateTimeOffset.UtcNow - Ttl;
        foreach (var key in _pending.Where(kv => kv.Value.CreatedAt < cutoff).Select(kv => kv.Key).ToList())
        {
            _pending.Remove(key);
        }
    }
}
