namespace Procurement.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(long userId);
}

public interface IPasswordHasher
{
    string Hash(string plainText);
    bool Verify(string plainText, string hash);
}
