using System.Security.Cryptography;
using System.Text;
using FadeChat.Infrastructure.Data.Encryption.Interfaces;
using Microsoft.Extensions.Options;

namespace FadeChat.Infrastructure.Data.Encryption;

public class CryptographyOptions
{
    public string PassPhrase { get; set; } = null!;
}

public class GenerateStringEncryptionProvider(IOptions<CryptographyOptions> cryptographyOptions)
    : IStringEncryptionProvider
{
    private const int _keysize = 256;
    private const int _blocksize = 128;
    private const int _derivationIterations = 1000;
    private readonly string _passPhrase = cryptographyOptions.Value.PassPhrase;

    public string Decrypt(string cipherText) => Decrypt(Convert.FromBase64String(cipherText));

    public string Encrypt(string plainText)
    {
        // Salt and IV is randomly generated each time, but is preprended to encrypted cipher text
        // so that the same Salt and IV values can be used when decrypting.  
        var saltStringBytes = GenerateRandomEntropyBytes(32);
        var ivStringBytes = GenerateRandomEntropyBytes();
        var plainTextBytes = Encoding.UTF8.GetBytes(plainText);

        using var password =
            new Rfc2898DeriveBytes(_passPhrase, saltStringBytes, _derivationIterations, HashAlgorithmName.SHA1);
        var keyBytes = password.GetBytes(_keysize / 8);

        using var symmetricKey = Aes.Create();
        symmetricKey.BlockSize = 128;
        symmetricKey.Mode = CipherMode.CBC;
        symmetricKey.Padding = PaddingMode.PKCS7;

        using var encryptor = symmetricKey.CreateEncryptor(keyBytes, ivStringBytes);
        var cipherTextBytes = saltStringBytes
            .Concat(ivStringBytes)
            .Concat(encryptor.TransformFinalBlock(plainTextBytes, 0, plainTextBytes.Length)).ToArray();

        // var decryptedText = Decrypt(cipherTextBytes);

        return Convert.ToBase64String(cipherTextBytes);
    }

    private string Decrypt(byte[] cipherTextBytesWithSaltAndIv)
    {
        // Get the complete stream of bytes that represent:
        // [32 bytes of Salt] + [16 bytes of IV] + [n bytes of CipherText]

        // Get the saltbytes by extracting the first 32 bytes from the supplied cipherText bytes.
        var saltStringBytes = cipherTextBytesWithSaltAndIv.Take(_keysize / 8).ToArray();
        // Get the IV bytes by extracting the next 16 bytes from the supplied cipherText bytes.
        var ivStringBytes = cipherTextBytesWithSaltAndIv.Skip(_keysize / 8).Take(_blocksize / 8).ToArray();
        // Get the actual cipher text bytes by removing the first 64 bytes from the cipherText string.
        var cipherTextBytes = cipherTextBytesWithSaltAndIv.Skip(_keysize / 8 + _blocksize / 8).ToArray();

        using var password =
            new Rfc2898DeriveBytes(_passPhrase, saltStringBytes, _derivationIterations, HashAlgorithmName.SHA1);
        var keyBytes = password.GetBytes(_keysize / 8);

        using var symmetricKey = Aes.Create();
        symmetricKey.BlockSize = 128;
        symmetricKey.Mode = CipherMode.CBC;
        symmetricKey.Padding = PaddingMode.PKCS7;

        using var decryptor = symmetricKey.CreateDecryptor(keyBytes, ivStringBytes);
        var plainTextBytes = decryptor.TransformFinalBlock(cipherTextBytes, 0, cipherTextBytes.Length);

        return Encoding.UTF8.GetString(plainTextBytes);
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