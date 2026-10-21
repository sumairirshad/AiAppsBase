using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using Tisoro.LinkedIn.Api.Configuration;

namespace Tisoro.LinkedIn.Api.Services;

public interface ITokenEncryptionService
{
    string Encrypt(string plaintext);
    string? Decrypt(string? ciphertext);
}

/// <summary>
/// AES-256-GCM encryption for third-party secrets (LinkedIn access/refresh
/// tokens) at rest, keyed by TOKEN_ENCRYPTION_KEY. Mirrors the scheme used
/// elsewhere in this codebase: SHA-256 the configured secret into a 32-byte
/// key so any length input works, store iv + tag + ciphertext together,
/// base64-joined. Decrypt never throws — a missing, malformed, or
/// wrong-key value returns null so a corrupted/rotated-key row fails
/// closed instead of crashing the request.
/// </summary>
public sealed class TokenEncryptionService : ITokenEncryptionService
{
    private readonly byte[] _key;
    private const int NonceSize = 12;
    private const int TagSize = 16;

    public TokenEncryptionService(IOptions<TokenEncryptionOptions> options, ILogger<TokenEncryptionService> logger)
    {
        var secret = options.Value.Key;
        if (string.IsNullOrWhiteSpace(secret))
        {
            throw new InvalidOperationException(
                "TOKEN_ENCRYPTION_KEY is required to store LinkedIn tokens securely. Set it before starting the app.");
        }
        _key = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(secret));
    }

    public string Encrypt(string plaintext)
    {
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var plaintextBytes = System.Text.Encoding.UTF8.GetBytes(plaintext);
        var ciphertext = new byte[plaintextBytes.Length];
        var tag = new byte[TagSize];

        using var aes = new AesGcm(_key, TagSize);
        aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        return string.Join('.', Convert.ToBase64String(nonce), Convert.ToBase64String(tag), Convert.ToBase64String(ciphertext));
    }

    public string? Decrypt(string? ciphertextPackage)
    {
        if (string.IsNullOrEmpty(ciphertextPackage)) return null;

        var parts = ciphertextPackage.Split('.');
        if (parts.Length != 3) return null;

        try
        {
            var nonce = Convert.FromBase64String(parts[0]);
            var tag = Convert.FromBase64String(parts[1]);
            var ciphertext = Convert.FromBase64String(parts[2]);
            var plaintext = new byte[ciphertext.Length];

            using var aes = new AesGcm(_key, TagSize);
            aes.Decrypt(nonce, ciphertext, tag, plaintext);

            return System.Text.Encoding.UTF8.GetString(plaintext);
        }
        catch (Exception)
        {
            return null;
        }
    }
}
