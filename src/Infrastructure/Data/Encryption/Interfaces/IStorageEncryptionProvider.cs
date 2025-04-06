namespace FadeChat.Infrastructure.Data.Encryption.Interfaces;

public interface IStorageEncryptionProvider
{
    byte[] Encrypt(byte[] dataToEncrypt);
    byte[] Decrypt(byte[] dataToDecrypt);
}