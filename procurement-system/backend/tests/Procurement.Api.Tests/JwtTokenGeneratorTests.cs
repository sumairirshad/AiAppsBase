using System.IdentityModel.Tokens.Jwt;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Procurement.Infrastructure.Services;

namespace Procurement.Api.Tests;

// Confirms the spec's "JWT carries only the user id" rule at the token-generation level - no
// database required, so this runs even without a live SQL Server.
public class JwtTokenGeneratorTests
{
    private static JwtTokenGenerator CreateGenerator() => new(Options.Create(new JwtOptions
    {
        Issuer = "test-issuer",
        Audience = "test-audience",
        SigningKey = "unit_test_signing_key_at_least_32_characters_long",
        AccessTokenMinutes = 60,
    }));

    [Fact]
    public void Token_carries_only_the_user_id_as_the_subject_claim()
    {
        var generator = CreateGenerator();
        var (token, expiresAtUtc) = generator.Generate(42);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Subject.Should().Be("42");
        jwt.Claims.Should().NotContain(c => c.Type == "role" || c.Type == "department" || c.Type == "permissions");
        expiresAtUtc.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public void Token_is_signed_with_the_configured_issuer_and_audience()
    {
        var generator = CreateGenerator();
        var (token, _) = generator.Generate(1);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Issuer.Should().Be("test-issuer");
        jwt.Audiences.Should().Contain("test-audience");
    }
}
