using SpillTea.Application.Common.Interfaces;
using SpillTea.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace SpillTea.Application.Chat.Events;

public record ChatMessageReceivedEvent(int? MessageId, string ReceiverId, string? MessageGuid = null) : INotification;

public class ChatMessageReceivedEventHandler(IApplicationDbContext context) : INotificationHandler<ChatMessageReceivedEvent>
{
    public async Task Handle(ChatMessageReceivedEvent notification, CancellationToken cancellationToken)
    {
        ChatMessage? message = null;

        if (notification.MessageId.HasValue && notification.MessageId > 0)
        {
            message = await context.ChatMessages
                .FirstOrDefaultAsync(x => x.Id == notification.MessageId.Value, cancellationToken);
        }
        else if (!string.IsNullOrEmpty(notification.MessageGuid))
        {
            message = await context.ChatMessages
                .FirstOrDefaultAsync(x => x.Guid == notification.MessageGuid, cancellationToken);
        }

        if (message is { State: MessageState.Sent })
        {
            message.State = MessageState.Received;
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
