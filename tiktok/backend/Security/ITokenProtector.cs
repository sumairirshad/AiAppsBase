namespace TikTok.Api.Security;

public interface ITokenProtector
{
    string Protect(string plaintext);
    string Unprotect(string protectedText);
}
