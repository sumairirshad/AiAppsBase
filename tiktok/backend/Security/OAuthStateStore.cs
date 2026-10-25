using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace TikTok.Api.Security;

public record OAuthStateEntry(string CodeVerifier, DateTimeOffset ExpiresAt);

public interface IOAuthStateStore
{
    string CreateState(string codeVerifier);
    bool TryConsume(string state, out string codeVerifier);
}

public class OAuthStateStore : IOAuthStateStore
{
    private readonly ConcurrentDictionary<string, OAuthStateEntry> _entries = new();
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    public string CreateState(string codeVerifier)
    {
        PruneExpired();
        var state = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
        _entries[state] = new OAuthStateEntry(codeVerifier, DateTimeOffset.UtcNow.Add(Lifetime));
        return state;
    }

    public bool TryConsume(string state, out string codeVerifier)
    {
        codeVerifier = string.Empty;
        if (!_entries.TryRemove(state, out var entry))
        {
            return false;
        }

        if (entry.ExpiresAt < DateTimeOffset.UtcNow)
        {
            return false;
        }

        codeVerifier = entry.CodeVerifier;
        return true;
    }

    private void PruneExpired()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var key in _entries.Where(kv => kv.Value.ExpiresAt < now).Select(kv => kv.Key).ToList())
        {
            _entries.TryRemove(key, out _);
        }
    }
}
