using FadeChat.Application.Common.Interfaces;
using FadeChat.Domain.Entities;

namespace FadeChat.Application.Chat.Events;

public record ChatMessageReadEvent(int MessageId, string SenderId) : INotification;

public class ChatMessageReadEventHandler(IApplicationDbContext context) : INotificationHandler<ChatMessageReadEvent>
{

    public async Task Handle(ChatMessageReadEvent notification, CancellationToken cancellationToken)
    {
        var message = await context.ChatMessages
            .Include(x => x.Chat)
            .ThenInclude(x => x.Messages)
            .FirstOrDefaultAsync(x => x.Id == notification.MessageId, cancellationToken);

        if (message != null)
        {
            message.State = MessageState.Read;

            message.Chat.UnreadCount = message.Chat.Messages.Count(m => m.State != MessageState.Read && m.SenderId != notification.SenderId);

            // Save the updated chat summary data
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}