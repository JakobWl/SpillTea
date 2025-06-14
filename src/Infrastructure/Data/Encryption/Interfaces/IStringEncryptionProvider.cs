namespace SpillTea.Infrastructure.Data.Encryption.Interfaces;

public interface IStringEncryptionProvider
{
    string Encrypt(string dataToEncrypt);
    string Decrypt(string dataToDecrypt);
}
