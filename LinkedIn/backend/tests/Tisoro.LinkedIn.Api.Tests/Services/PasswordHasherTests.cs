using Tisoro.LinkedIn.Api.Services;
using Xunit;

namespace Tisoro.LinkedIn.Api.Tests.Services;

public class PasswordHasherTests
{
    private readonly Pbkdf2PasswordHasher _hasher = new();

    [Fact]
    public void Verify_succeeds_for_the_correct_password()
    {
        var hash = _hasher.Hash("correct horse battery staple");
        Assert.True(_hasher.Verify("correct horse battery staple", hash));
    }

    [Fact]
    public void Verify_fails_for_the_wrong_password()
    {
        var hash = _hasher.Hash("correct horse battery staple");
        Assert.False(_hasher.Verify("wrong password", hash));
    }

    [Fact]
    public void Hash_is_salted_differently_each_time()
    {
        Assert.NotEqual(_hasher.Hash("same-password"), _hasher.Hash("same-password"));
    }

    [Theory]
    [InlineData("not-a-valid-hash")]
    [InlineData("100000.notbase64!!.notbase64!!")]
    [InlineData("")]
    public void Verify_fails_closed_for_a_malformed_hash_instead_of_throwing(string malformedHash)
    {
        Assert.False(_hasher.Verify("anything", malformedHash));
    }
}
