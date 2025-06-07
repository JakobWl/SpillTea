using FadeChat.Application.Common.Interfaces;
using FadeChat.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FadeChat.Application.Chat.Events;

public record ChatMessageReceivedEvent(int MessageId, string ReceiverId) : INotification;

public class ChatMessageReceivedEventHandler(IApplicationDbContext context) : INotificationHandler<ChatMessageReceivedEvent>
{
    public async Task Handle(ChatMessageReceivedEvent notification, CancellationToken cancellationToken)
    {
        var message = await context.ChatMessages
            .FirstOrDefaultAsync(x => x.Id == notification.MessageId, cancellationToken);

        if (message != null && message.State == MessageState.Sent)
        {
            message.State = MessageState.Received;
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
