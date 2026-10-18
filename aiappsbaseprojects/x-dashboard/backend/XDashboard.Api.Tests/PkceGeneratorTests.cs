using System.Security.Cryptography;
using System.Text;
using XDashboard.Api.Services.X;

namespace XDashboard.Api.Tests;

public class PkceGeneratorTests
{
    [Fact]
    public void GenerateCodeVerifier_ProducesRfc7636CompliantLength()
    {
        var verifier = PkceGenerator.GenerateCodeVerifier();

        Assert.InRange(verifier.Length, 43, 128);
        Assert.Matches("^[A-Za-z0-9_-]+$", verifier);
    }

    [Fact]
    public void GenerateCodeVerifier_IsUnpredictableAcrossCalls()
    {
        var first = PkceGenerator.GenerateCodeVerifier();
        var second = PkceGenerator.GenerateCodeVerifier();

        Assert.NotEqual(first, second);
    }

    [Fact]
    public void GenerateState_IsUnpredictableAcrossCalls()
    {
        var first = PkceGenerator.GenerateState();
        var second = PkceGenerator.GenerateState();

        Assert.NotEqual(first, second);
        Assert.False(string.IsNullOrWhiteSpace(first));
    }

    [Fact]
    public void DeriveCodeChallenge_MatchesManualSha256Base64UrlComputation()
    {
        const string verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

        var challenge = PkceGenerator.DeriveCodeChallenge(verifier);

        var expectedHash = SHA256.HashData(Encoding.ASCII.GetBytes(verifier));
        var expected = Convert.ToBase64String(expectedHash).TrimEnd('=').Replace('+', '-').Replace('/', '_');

        Assert.Equal(expected, challenge);
    }

    [Fact]
    public void DeriveCodeChallenge_IsDeterministicForTheSameVerifier()
    {
        var verifier = PkceGenerator.GenerateCodeVerifier();

        var first = PkceGenerator.DeriveCodeChallenge(verifier);
        var second = PkceGenerator.DeriveCodeChallenge(verifier);

        Assert.Equal(first, second);
    }
}
