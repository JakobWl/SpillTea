namespace FadeChat.Infrastructure.Data.Encryption.Interfaces;

public interface IBinaryEncryptionProvider
{
    byte[] Encrypt(byte[] dataToEncrypt);
    byte[] Decrypt(byte[] dataToDecrypt);
}