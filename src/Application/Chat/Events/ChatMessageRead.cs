using FadeChat.Application.Common.Interfaces;
using FadeChat.Domain.Entities;

namespace FadeChat.Application.Chat.Events;

public record ChatMessageReadEvent(int? MessageId, string SenderId, string? MessageGuid = null) : INotification;

public class ChatMessageReadEventHandler(IApplicationDbContext context) : INotificationHandler<ChatMessageReadEvent>
{

    public async Task Handle(ChatMessageReadEvent notification, CancellationToken cancellationToken)
    {
        ChatMessage? message = null;

        if (notification.MessageId.HasValue && notification.MessageId > 0)
        {
            message = await context.ChatMessages
                .Include(x => x.Chat)
                .ThenInclude(x => x.Messages)
                .FirstOrDefaultAsync(x => x.Id == notification.MessageId.Value, cancellationToken);
        }
        else if (!string.IsNullOrEmpty(notification.MessageGuid))
        {
            message = await context.ChatMessages
                .Include(x => x.Chat)
                .ThenInclude(x => x.Messages)
                .FirstOrDefaultAsync(x => x.Guid == notification.MessageGuid, cancellationToken);
        }

        if (message != null)
        {
            message.State = MessageState.Read;

            message.Chat.UnreadCount = message.Chat.Messages.Count(m => m.State != MessageState.Read && m.SenderId != notification.SenderId);

            // Save the updated chat summary data
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}