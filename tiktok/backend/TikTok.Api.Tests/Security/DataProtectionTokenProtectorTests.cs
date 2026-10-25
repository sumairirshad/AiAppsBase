using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;
using TikTok.Api.Configuration;
using TikTok.Api.Security;

namespace TikTok.Api.Tests.Security;

public class DataProtectionTokenProtectorTests
{
    [Fact]
    public void ProtectThenUnprotect_RoundTripsOriginalValue()
    {
        var provider = new EphemeralDataProtectionProvider();
        var options = Options.Create(new AppSecurityOptions { TokenEncryptionPurpose = "test-purpose" });
        var protector = new DataProtectionTokenProtector(provider, options);

        var protectedValue = protector.Protect("super-secret-access-token");
        var result = protector.Unprotect(protectedValue);

        Assert.Equal("super-secret-access-token", result);
        Assert.NotEqual("super-secret-access-token", protectedValue);
    }

    [Fact]
    public void Unprotect_WithWrongPurpose_Throws()
    {
        var provider = new EphemeralDataProtectionProvider();
        var protectorA = new DataProtectionTokenProtector(provider, Options.Create(new AppSecurityOptions { TokenEncryptionPurpose = "purpose-a" }));
        var protectorB = new DataProtectionTokenProtector(provider, Options.Create(new AppSecurityOptions { TokenEncryptionPurpose = "purpose-b" }));

        var protectedValue = protectorA.Protect("token");

        Assert.ThrowsAny<Exception>(() => protectorB.Unprotect(protectedValue));
    }
}
