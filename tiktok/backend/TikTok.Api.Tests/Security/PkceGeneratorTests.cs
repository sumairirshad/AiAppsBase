using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using TikTok.Api.Security;

namespace TikTok.Api.Tests.Security;

public class PkceGeneratorTests
{
    [Fact]
    public void Generate_ProducesVerifierWithinRfcLengthAndCharset()
    {
        var pair = PkceGenerator.Generate();

        Assert.InRange(pair.CodeVerifier.Length, 43, 128);
        Assert.Matches(new Regex("^[A-Za-z0-9\\-._~]+$"), pair.CodeVerifier);
    }

    [Fact]
    public void Generate_ChallengeIsHexEncodedSha256OfVerifier_PerTikTokSpec()
    {
        var pair = PkceGenerator.Generate();

        var expectedHash = Convert.ToHexString(SHA256.HashData(Encoding.ASCII.GetBytes(pair.CodeVerifier))).ToLowerInvariant();
        Assert.Equal(expectedHash, pair.CodeChallenge);
        Assert.DoesNotContain("+", pair.CodeChallenge);
        Assert.DoesNotContain("=", pair.CodeChallenge);
    }

    [Fact]
    public void Generate_ProducesUniqueVerifiersEachCall()
    {
        var first = PkceGenerator.Generate();
        var second = PkceGenerator.Generate();

        Assert.NotEqual(first.CodeVerifier, second.CodeVerifier);
    }
}
