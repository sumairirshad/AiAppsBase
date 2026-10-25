using Instagram.Api.Security;
using Microsoft.Extensions.Caching.Memory;
using Xunit;

namespace Instagram.Api.Tests.Security;

public class OAuthStateServiceTests
{
    private static OAuthStateService CreateService() =>
        new(new MemoryCache(new MemoryCacheOptions()));

    [Fact]
    public void CreateHandshake_ProducesUniqueStateAndMatchingCodeChallenge()
    {
        var service = CreateService();

        var first = service.CreateHandshake();
        var second = service.CreateHandshake();

        Assert.NotEqual(first.State, second.State);
        Assert.NotEqual(first.CodeVerifier, first.CodeChallenge);
        Assert.NotEmpty(first.CodeChallenge);
    }

    [Fact]
    public void TryConsume_WithValidState_SucceedsOnceThenFails()
    {
        var service = CreateService();
        var handshake = service.CreateHandshake();

        var firstAttempt = service.TryConsume(handshake.State, out var verifier);
        var secondAttempt = service.TryConsume(handshake.State, out _);

        Assert.True(firstAttempt);
        Assert.Equal(handshake.CodeVerifier, verifier);
        Assert.False(secondAttempt);
    }

    [Fact]
    public void TryConsume_WithUnknownState_Fails()
    {
        var service = CreateService();

        var result = service.TryConsume("never-issued-state", out var verifier);

        Assert.False(result);
        Assert.Equal(string.Empty, verifier);
    }
}
