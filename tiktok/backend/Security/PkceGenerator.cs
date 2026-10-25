using System.Security.Cryptography;
using System.Text;

namespace TikTok.Api.Security;

public record PkcePair(string CodeVerifier, string CodeChallenge);

public static class PkceGenerator
{
    private const string Unreserved = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    public static PkcePair Generate()
    {
        var verifier = GenerateCodeVerifier();
        var challenge = ComputeTikTokCodeChallenge(verifier);
        return new PkcePair(verifier, challenge);
    }

    private static string GenerateCodeVerifier()
    {
        const int length = 64;
        var bytes = RandomNumberGenerator.GetBytes(length);
        var builder = new StringBuilder(length);
        foreach (var b in bytes)
        {
            builder.Append(Unreserved[b % Unreserved.Length]);
        }
        return builder.ToString();
    }

    // TikTok departs from standard RFC 7636: the challenge is the lowercase
    // hex digest of SHA-256(verifier), not the base64url digest other providers use.
    private static string ComputeTikTokCodeChallenge(string verifier)
    {
        var hash = SHA256.HashData(Encoding.ASCII.GetBytes(verifier));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
