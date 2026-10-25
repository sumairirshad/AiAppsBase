using System.Security.Cryptography;
using Microsoft.Extensions.Caching.Memory;

namespace Instagram.Api.Security;

public record OAuthHandshake(string State, string CodeVerifier, string CodeChallenge);

public interface IOAuthStateService
{
    OAuthHandshake CreateHandshake();
    bool TryConsume(string state, out string codeVerifier);
}

public class OAuthStateService(IMemoryCache cache) : IOAuthStateService
{
    private static readonly TimeSpan HandshakeLifetime = TimeSpan.FromMinutes(10);

    public OAuthHandshake CreateHandshake()
    {
        var state = GenerateUrlSafeToken(32);
        var codeVerifier = GenerateUrlSafeToken(64);
        var codeChallenge = ComputeCodeChallenge(codeVerifier);

        cache.Set(CacheKey(state), codeVerifier, HandshakeLifetime);

        return new OAuthHandshake(state, codeVerifier, codeChallenge);
    }

    public bool TryConsume(string state, out string codeVerifier)
    {
        var key = CacheKey(state);
        if (cache.TryGetValue(key, out string? storedVerifier) && storedVerifier is not null)
        {
            cache.Remove(key);
            codeVerifier = storedVerifier;
            return true;
        }

        codeVerifier = string.Empty;
        return false;
    }

    private static string CacheKey(string state) => $"oauth-state:{state}";

    private static string GenerateUrlSafeToken(int byteLength)
    {
        var bytes = RandomNumberGenerator.GetBytes(byteLength);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }

    private static string ComputeCodeChallenge(string codeVerifier)
    {
        var bytes = SHA256.HashData(System.Text.Encoding.ASCII.GetBytes(codeVerifier));
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }
}
