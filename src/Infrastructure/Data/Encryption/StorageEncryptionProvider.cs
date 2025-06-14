using System.Security.Cryptography;
using SpillTea.Infrastructure.Data.Encryption.Interfaces;
using Microsoft.Extensions.Options;

namespace SpillTea.Infrastructure.Data.Encryption;

public class StorageEncryptionProvider(IOptions<CryptographyOptions> cryptographyOptions) : IStorageEncryptionProvider
{
    private const int KeySize = 256;
    private const int BlockSize = 128;
    private const int DerivationIterations = 1000;
    private readonly string _passphrase = cryptographyOptions.Value.PassPhrase;

    public byte[] Decrypt(byte[] cipherTextBytesWithSaltAndIv)
    {
        // Get the complete stream of bytes that represent:
        // [32 bytes of Salt] + [16 bytes of IV] + [n bytes of CipherText]

        // Get the saltbytes by extracting the first 32 bytes from the supplied cipherText bytes.
        var saltStringBytes = cipherTextBytesWithSaltAndIv.Take(KeySize / 8).ToArray();
        // Get the IV bytes by extracting the next 16 bytes from the supplied cipherText bytes.
        var ivStringBytes = cipherTextBytesWithSaltAndIv.Skip(KeySize / 8).Take(BlockSize / 8).ToArray();
        // Get the actual cipher text bytes by removing the first 64 bytes from the cipherText string.
        var cipherTextBytes = cipherTextBytesWithSaltAndIv.Skip(KeySize / 8 + BlockSize / 8).ToArray();

        using var password =
            new Rfc2898DeriveBytes(_passphrase, saltStringBytes, DerivationIterations, HashAlgorithmName.SHA1);
        var keyBytes = password.GetBytes(KeySize / 8);

        using var symmetricKey = Aes.Create();
        symmetricKey.BlockSize = 128;
        symmetricKey.Mode = CipherMode.CBC;
        symmetricKey.Padding = PaddingMode.PKCS7;

        using var decryptor = symmetricKey.CreateDecryptor(keyBytes, ivStringBytes);
        var plainTextBytes = decryptor.TransformFinalBlock(cipherTextBytes, 0, cipherTextBytes.Length);

        return plainTextBytes;
    }

    public byte[] Encrypt(byte[] plainTextBytes)
    {
        // Salt and IV is randomly generated each time, but is preprended to encrypted cipher text
        // so that the same Salt and IV values can be used when decrypting.  
        var saltStringBytes = GenerateRandomEntropyBytes(32);
        var ivStringBytes = GenerateRandomEntropyBytes();

        using var password =
            new Rfc2898DeriveBytes(_passphrase, saltStringBytes, DerivationIterations, HashAlgorithmName.SHA1);
        var keyBytes = password.GetBytes(KeySize / 8);

        using var symmetricKey = Aes.Create();
        symmetricKey.BlockSize = 128;
        symmetricKey.Mode = CipherMode.CBC;
        symmetricKey.Padding = PaddingMode.PKCS7;

        using var encryptor = symmetricKey.CreateEncryptor(keyBytes, ivStringBytes);
        var cipherTextBytes = saltStringBytes
            .Concat(ivStringBytes)
            .Concat(encryptor.TransformFinalBlock(plainTextBytes, 0, plainTextBytes.Length)).ToArray();

        return cipherTextBytes;
    }

    private static byte[] GenerateRandomEntropyBytes(int size = 16)
    {
        var randomBytes = new byte[size];
        using var rngCsp = RandomNumberGenerator.Create();

        // Fill the array with cryptographically secure random bytes.
        rngCsp.GetBytes(randomBytes);

        return randomBytes;
    }
}
