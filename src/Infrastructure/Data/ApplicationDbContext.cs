using SpillTea.Application.Common.Interfaces;
using SpillTea.Domain.Entities;
using SpillTea.Infrastructure.Data.Encryption.Interfaces;
using SpillTea.Infrastructure.Data.Extensions;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace SpillTea.Infrastructure.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<User>(options), IApplicationDbContext
{
    public DbSet<Chat> Chats => Set<Chat>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.UseEncryption(this.GetService<IStringEncryptionProvider>(),
            this.GetService<IBinaryEncryptionProvider>());

        builder.Entity<ChatMessage>()
            .HasIndex(cm => cm.Guid);
    }
}
