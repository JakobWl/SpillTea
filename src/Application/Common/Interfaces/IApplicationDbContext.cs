using SpillTea.Domain.Entities;

namespace SpillTea.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Domain.Entities.Chat> Chats { get; }
    DbSet<ChatMessage> ChatMessages { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
