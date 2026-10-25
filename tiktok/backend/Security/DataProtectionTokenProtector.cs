using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;
using TikTok.Api.Configuration;

namespace TikTok.Api.Security;

public class DataProtectionTokenProtector : ITokenProtector
{
    private readonly IDataProtector _protector;

    public DataProtectionTokenProtector(IDataProtectionProvider provider, IOptions<AppSecurityOptions> options)
    {
        _protector = provider.CreateProtector(options.Value.TokenEncryptionPurpose);
    }

    public string Protect(string plaintext) => _protector.Protect(plaintext);

    public string Unprotect(string protectedText) => _protector.Unprotect(protectedText);
}
