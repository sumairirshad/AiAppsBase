using TikTok.Api.Security;

namespace TikTok.Api.Tests.Security;

public class OAuthStateStoreTests
{
    [Fact]
    public void CreateThenConsume_ReturnsOriginalVerifier()
    {
        var store = new OAuthStateStore();
        var state = store.CreateState("verifier-123");

        var consumed = store.TryConsume(state, out var verifier);

        Assert.True(consumed);
        Assert.Equal("verifier-123", verifier);
    }

    [Fact]
    public void Consume_CanOnlyHappenOnce()
    {
        var store = new OAuthStateStore();
        var state = store.CreateState("verifier-123");

        store.TryConsume(state, out _);
        var secondAttempt = store.TryConsume(state, out var verifier);

        Assert.False(secondAttempt);
        Assert.Equal(string.Empty, verifier);
    }

    [Fact]
    public void Consume_UnknownStateFails()
    {
        var store = new OAuthStateStore();

        var result = store.TryConsume("never-issued", out var verifier);

        Assert.False(result);
        Assert.Equal(string.Empty, verifier);
    }
}
