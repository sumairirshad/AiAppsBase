using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Infrastructure.Auth;

public class AesEncryptionService : IEncryptionService
{
    private readonly byte[] _key;

    public AesEncryptionService(IConfiguration configuration)
    {
        var secret = configuration["Jwt:SigningKey"] ?? throw new InvalidOperationException("Jwt:SigningKey is not configured.");
        _key = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }

    public byte[] Encrypt(string plainText)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.GenerateIV();
        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
        return [.. aes.IV, .. cipherBytes];
    }

    public string Decrypt(byte[] cipherBytes)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        var iv = cipherBytes[..16];
        var actualCipher = cipherBytes[16..];
        aes.IV = iv;
        using var decryptor = aes.CreateDecryptor();
        var plainBytes = decryptor.TransformFinalBlock(actualCipher, 0, actualCipher.Length);
        return Encoding.UTF8.GetString(plainBytes);
    }
}
