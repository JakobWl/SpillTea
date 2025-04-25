using FadeChat.Application.Common.Interfaces;
using FadeChat.Domain.Entities;
using FadeChat.Infrastructure.Data.Encryption.Interfaces;
using FadeChat.Infrastructure.Data.Extensions;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace FadeChat.Infrastructure.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<User>(options), IApplicationDbContext
{
    public DbSet<Chat> Chats => Set<Chat>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.UseEncryption(this.GetService<IStringEncryptionProvider>(),
            this.GetService<IBinaryEncryptionProvider>());
    }
}