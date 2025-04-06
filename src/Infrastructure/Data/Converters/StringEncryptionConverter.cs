using FadeChat.Infrastructure.Data.Encryption.Interfaces;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace FadeChat.Infrastructure.Data.Converters;

internal sealed class StringEncryptionConverter(
    IStringEncryptionProvider stringEncryptionProvider,
    ConverterMappingHints? mappingHints = null)
    : ValueConverter<string, string>(x => stringEncryptionProvider.Encrypt(x),
        x => stringEncryptionProvider.Decrypt(x), mappingHints);

internal sealed class BinaryEncryptionConverter(
    IBinaryEncryptionProvider binaryEncryptionProvider,
    ConverterMappingHints? mappingHints = null)
    : ValueConverter<byte[], byte[]>(x => binaryEncryptionProvider.Encrypt(x),
        x => binaryEncryptionProvider.Decrypt(x), mappingHints);