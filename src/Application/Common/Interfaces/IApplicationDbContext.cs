using FadeChat.Domain.Entities;

namespace FadeChat.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Domain.Entities.Chat> Chats { get; }
    DbSet<ChatMessage> ChatMessages { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}