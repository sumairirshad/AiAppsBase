using XDashboard.Api.Services.X;
using OptionsFactory = Microsoft.Extensions.Options.Options;
using SecurityOptions = XDashboard.Api.Options.SecurityOptions;

namespace XDashboard.Api.Tests;

public class EncryptedInMemoryTokenStoreTests
{
    private static EncryptedInMemoryTokenStore CreateStore(string? key = null)
    {
        var options = OptionsFactory.Create(new SecurityOptions
        {
            TokenEncryptionKey = key ?? Convert.ToBase64String(new byte[32]),
        });
        return new EncryptedInMemoryTokenStore(options);
    }

    [Fact]
    public async Task GetAsync_ReturnsNull_WhenNothingHasBeenSaved()
    {
        var store = CreateStore();

        var result = await store.GetAsync();

        Assert.Null(result);
    }

    [Fact]
    public async Task SaveAsync_ThenGetAsync_RoundTripsAllFields()
    {
        var store = CreateStore();
        var tokens = new XTokenSet
        {
            AccessToken = "access-123",
            RefreshToken = "refresh-456",
            ExpiresAt = DateTimeOffset.UtcNow.AddHours(2),
            Scope = "tweet.read tweet.write",
        };

        await store.SaveAsync(tokens);
        var result = await store.GetAsync();

        Assert.NotNull(result);
        Assert.Equal(tokens.AccessToken, result!.AccessToken);
        Assert.Equal(tokens.RefreshToken, result.RefreshToken);
        Assert.Equal(tokens.Scope, result.Scope);
        Assert.Equal(tokens.ExpiresAt, result.ExpiresAt);
    }

    [Fact]
    public async Task ClearAsync_RemovesStoredTokens()
    {
        var store = CreateStore();
        await store.SaveAsync(new XTokenSet { AccessToken = "a", ExpiresAt = DateTimeOffset.UtcNow.AddHours(1) });

        await store.ClearAsync();
        var result = await store.GetAsync();

        Assert.Null(result);
    }

    [Fact]
    public void Constructor_Throws_WhenEncryptionKeyIsMissing()
    {
        var options = OptionsFactory.Create(new SecurityOptions { TokenEncryptionKey = string.Empty });

        Assert.Throws<InvalidOperationException>(() => new EncryptedInMemoryTokenStore(options));
    }

    [Fact]
    public void Constructor_Throws_WhenEncryptionKeyIsNotValidBase64()
    {
        var options = OptionsFactory.Create(new SecurityOptions { TokenEncryptionKey = "not-base64!!!" });

        Assert.Throws<InvalidOperationException>(() => new EncryptedInMemoryTokenStore(options));
    }

    [Fact]
    public void Constructor_Throws_WhenKeyIsNot32Bytes()
    {
        var options = OptionsFactory.Create(new SecurityOptions { TokenEncryptionKey = Convert.ToBase64String(new byte[16]) });

        Assert.Throws<InvalidOperationException>(() => new EncryptedInMemoryTokenStore(options));
    }
}
