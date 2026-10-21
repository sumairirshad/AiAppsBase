using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Tisoro.LinkedIn.Api.Configuration;
using Tisoro.LinkedIn.Api.Services;
using Xunit;

namespace Tisoro.LinkedIn.Api.Tests.Services;

public class TokenEncryptionServiceTests
{
    private static TokenEncryptionService CreateService(string key = "test-key-not-for-production") =>
        new(Options.Create(new TokenEncryptionOptions { Key = key }), NullLogger<TokenEncryptionService>.Instance);

    [Fact]
    public void RoundTrips_a_plaintext_value()
    {
        var service = CreateService();
        var ciphertext = service.Encrypt("a-linkedin-access-token");

        Assert.DoesNotContain("a-linkedin-access-token", ciphertext);
        Assert.Equal("a-linkedin-access-token", service.Decrypt(ciphertext));
    }

    [Fact]
    public void Produces_different_ciphertext_for_the_same_input_each_time()
    {
        var service = CreateService();
        Assert.NotEqual(service.Encrypt("same-secret"), service.Encrypt("same-secret"));
    }

    [Fact]
    public void Fails_closed_on_tampered_ciphertext()
    {
        var service = CreateService();
        var ciphertext = service.Encrypt("a-secret-value");
        var tampered = ciphertext[..^4] + "AAAA";

        Assert.Null(service.Decrypt(tampered));
    }

    [Fact]
    public void Returns_null_for_garbage_or_missing_input_instead_of_throwing()
    {
        var service = CreateService();
        Assert.Null(service.Decrypt("not-a-valid-token"));
        Assert.Null(service.Decrypt(null));
        Assert.Null(service.Decrypt(""));
    }

    [Fact]
    public void Cannot_decrypt_a_value_encrypted_with_a_different_key()
    {
        var a = CreateService("key-one");
        var b = CreateService("key-two");

        var ciphertext = a.Encrypt("secret");
        Assert.Null(b.Decrypt(ciphertext));
    }

    [Fact]
    public void Throws_at_construction_when_no_key_is_configured()
    {
        Assert.Throws<InvalidOperationException>(() => CreateService(key: ""));
    }
}
