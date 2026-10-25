namespace Instagram.Api.Security;

public interface ITokenProtector
{
    string Protect(string plaintext);
    string Unprotect(string ciphertext);
}
