using FadeChat.Application.Chat.Dtos;
using FadeChat.Application.Common.Interfaces;
using FadeChat.Domain.Entities;

namespace FadeChat.Application.Chat.Events;

public record ChatMessageSentEvent(ChatMessageDto Message) : INotification;

public class ChatMessageSentEventHandler(IApplicationDbContext context) : INotificationHandler<ChatMessageSentEvent>
{

    public async Task Handle(ChatMessageSentEvent notification, CancellationToken cancellationToken)
    {
        var chat = await context.Chats
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == notification.Message.ChatId, cancellationToken);

        if (chat != null)
        {
            // Update the unread count (for instance, increase count for all recipients except the sender)
            chat.UnreadCount = chat.Messages.Count(m => m.State != MessageState.Read && m.SenderId != notification.Message.SenderId);

            // Update the last message field
            chat.LastMessage = notification.Message.Body;

            // Save the updated chat summary data
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}