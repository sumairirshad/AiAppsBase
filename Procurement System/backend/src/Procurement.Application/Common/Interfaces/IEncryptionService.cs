namespace Procurement.Application.Common.Interfaces;

public interface IEncryptionService
{
    byte[] Encrypt(string plainText);
    string Decrypt(byte[] cipherBytes);
}
