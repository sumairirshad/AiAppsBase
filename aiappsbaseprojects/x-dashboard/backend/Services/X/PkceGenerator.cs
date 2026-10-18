using System.Security.Cryptography;
using System.Text;

namespace XDashboard.Api.Services.X;

/// <summary>RFC 7636 PKCE helpers, factored out so they can be unit tested without any network
/// access or X API credentials.</summary>
public static class PkceGenerator
{
    public static string GenerateCodeVerifier()
    {
        // 32 random bytes -> 43 base64url characters, within the 43-128 character range RFC 7636 requires.
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Base64UrlEncode(bytes);
    }

    public static string GenerateState()
    {
        var bytes = RandomNumberGenerator.GetBytes(24);
        return Base64UrlEncode(bytes);
    }

    public static string DeriveCodeChallenge(string codeVerifier)
    {
        var hash = SHA256.HashData(Encoding.ASCII.GetBytes(codeVerifier));
        return Base64UrlEncode(hash);
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
}
