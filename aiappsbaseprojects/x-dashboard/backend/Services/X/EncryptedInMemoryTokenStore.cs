using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using XDashboard.Api.Options;

namespace XDashboard.Api.Services.X;

/// <summary>
/// Encrypts the connected account's OAuth tokens with AES-256-GCM (key from
/// TOKEN_ENCRYPTION_KEY) before holding them in memory, so a process memory dump or an
/// accidental log of the backing store never reveals a usable token.
/// </summary>
public class EncryptedInMemoryTokenStore : ITokenStore
{
    private const int NonceSizeBytes = 12;
    private const int TagSizeBytes = 16;

    private readonly byte[] _key;
    private readonly object _lock = new();
    private byte[]? _ciphertext;

    public EncryptedInMemoryTokenStore(IOptions<SecurityOptions> options)
    {
        var configuredKey = options.Value.TokenEncryptionKey;
        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            throw new InvalidOperationException(
                "TOKEN_ENCRYPTION_KEY is not configured. Generate one with " +
                "`openssl rand -base64 32` and set it as an environment variable. " +
                "See backend/.env.example.");
        }

        try
        {
            _key = Convert.FromBase64String(configuredKey);
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException(
                "TOKEN_ENCRYPTION_KEY must be base64-encoded. Generate one with " +
                "`openssl rand -base64 32`.", ex);
        }

        if (_key.Length != 32)
        {
            throw new InvalidOperationException(
                $"TOKEN_ENCRYPTION_KEY must decode to 32 bytes (256 bits); got {_key.Length}. " +
                "Generate one with `openssl rand -base64 32`.");
        }
    }

    public Task<XTokenSet?> GetAsync(CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            if (_ciphertext is null)
            {
                return Task.FromResult<XTokenSet?>(null);
            }

            var json = Decrypt(_ciphertext);
            var tokens = JsonSerializer.Deserialize<XTokenSet>(json);
            return Task.FromResult(tokens);
        }
    }

    public Task SaveAsync(XTokenSet tokens, CancellationToken cancellationToken = default)
    {
        var json = JsonSerializer.Serialize(tokens);
        var encrypted = Encrypt(json);
        lock (_lock)
        {
            _ciphertext = encrypted;
        }

        return Task.CompletedTask;
    }

    public Task ClearAsync(CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            _ciphertext = null;
        }

        return Task.CompletedTask;
    }

    private byte[] Encrypt(string plaintext)
    {
        var nonce = RandomNumberGenerator.GetBytes(NonceSizeBytes);
        var plainBytes = Encoding.UTF8.GetBytes(plaintext);
        var cipherBytes = new byte[plainBytes.Length];
        var tag = new byte[TagSizeBytes];

        using var aesGcm = new AesGcm(_key, TagSizeBytes);
        aesGcm.Encrypt(nonce, plainBytes, cipherBytes, tag);

        // Layout: nonce || tag || ciphertext
        var result = new byte[NonceSizeBytes + TagSizeBytes + cipherBytes.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, NonceSizeBytes);
        Buffer.BlockCopy(tag, 0, result, NonceSizeBytes, TagSizeBytes);
        Buffer.BlockCopy(cipherBytes, 0, result, NonceSizeBytes + TagSizeBytes, cipherBytes.Length);
        return result;
    }

    private string Decrypt(byte[] payload)
    {
        var nonce = payload[..NonceSizeBytes];
        var tag = payload[NonceSizeBytes..(NonceSizeBytes + TagSizeBytes)];
        var cipherBytes = payload[(NonceSizeBytes + TagSizeBytes)..];
        var plainBytes = new byte[cipherBytes.Length];

        using var aesGcm = new AesGcm(_key, TagSizeBytes);
        aesGcm.Decrypt(nonce, cipherBytes, tag, plainBytes);

        return Encoding.UTF8.GetString(plainBytes);
    }
}
