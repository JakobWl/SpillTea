using FadeChat.Domain.Common;
using FadeChat.Infrastructure.Data.Converters;
using FadeChat.Infrastructure.Data.Encryption.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace FadeChat.Infrastructure.Data.Extensions;

public static class ModelBuilderExtensions
{
    public static void UseEncryption(this ModelBuilder modelBuilder, IStringEncryptionProvider stringEncryptionProvider,
        IBinaryEncryptionProvider binaryEncryptionProvider)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);
        ArgumentNullException.ThrowIfNull(stringEncryptionProvider);

        var stringEncryptionConverter = new StringEncryptionConverter(stringEncryptionProvider);
        var binaryEncryptionConverter = new BinaryEncryptionConverter(binaryEncryptionProvider);
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        foreach (var property in entityType.GetProperties())
        {
            var attributes = property.PropertyInfo?.GetCustomAttributes(typeof(EncryptedAttribute), false);

            if (attributes?.Length == 0)
                continue;

            if (property.ClrType == typeof(string))
            {
                property.SetValueConverter(stringEncryptionConverter);
            }
            else if (property.ClrType == typeof(byte[]))
            {
                property.SetValueConverter(binaryEncryptionConverter);
                property.SetValueComparer(new ValueComparer<byte[]>(
                    (b1, b2) => b1 == null && b2 == null || b1 != null && b2 != null && b1.SequenceEqual(b2),
                    b => b.Aggregate(0, (acc, b1) => HashCode.Combine(acc, b1.GetHashCode())),
                    b => b.ToArray()
                ));
            }
        }
    }
}