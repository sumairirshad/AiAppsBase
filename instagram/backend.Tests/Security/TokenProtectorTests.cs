using Instagram.Api.Security;
using Microsoft.AspNetCore.DataProtection;
using Xunit;

namespace Instagram.Api.Tests.Security;

public class TokenProtectorTests
{
    [Fact]
    public void Protect_Then_Unprotect_ReturnsOriginalValue()
    {
        var provider = DataProtectionProvider.Create(new System.IO.DirectoryInfo(Path.GetTempPath()));
        var protector = new DataProtectionTokenProtector(provider);

        const string original = "IGAAtoken-secret-value-123";
        var encrypted = protector.Protect(original);
        var decrypted = protector.Unprotect(encrypted);

        Assert.NotEqual(original, encrypted);
        Assert.Equal(original, decrypted);
    }

    [Fact]
    public void Unprotect_WithTamperedCiphertext_Throws()
    {
        var provider = DataProtectionProvider.Create(new System.IO.DirectoryInfo(Path.GetTempPath()));
        var protector = new DataProtectionTokenProtector(provider);

        var encrypted = protector.Protect("some-access-token");
        var tampered = encrypted[..^2] + "zz";

        Assert.ThrowsAny<Exception>(() => protector.Unprotect(tampered));
    }
}
