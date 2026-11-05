using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Infrastructure.Auth;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration) => _configuration = configuration;

    public string GenerateToken(long userId)
    {
        var jwt = _configuration.GetSection("Jwt");
        var signingKey = jwt["SigningKey"] ?? throw new InvalidOperationException("Jwt:SigningKey is not configured.");
        var minutes = double.TryParse(jwt["AccessTokenMinutes"], out var m) ? m : 60;

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(minutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class PasswordHasher : IPasswordHasher
{
    public string Hash(string plainText) => BCrypt.Net.BCrypt.HashPassword(plainText);
    public bool Verify(string plainText, string hash) => BCrypt.Net.BCrypt.Verify(plainText, hash);
}
