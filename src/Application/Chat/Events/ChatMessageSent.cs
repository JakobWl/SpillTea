using FadeChat.Application.Chat.Dtos;
using FadeChat.Application.Common.Interfaces;
using FadeChat.Domain.Entities;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace FadeChat.Application.Chat.Events;

public record ChatMessageSentEvent(ChatMessageDto Message) : INotification;

public class ChatMessageSentEventHandler(IApplicationDbContext context, IDistributedCache cache) : INotificationHandler<ChatMessageSentEvent>
{
    private const string PENDING_MESSAGE_PREFIX = "pending_message:";

    public static async Task AddPendingMessageAsync(IDistributedCache cache, string guid, ChatMessageDto message)
    {
        var key = PENDING_MESSAGE_PREFIX + guid;
        var value = JsonSerializer.Serialize(message);
        var options = new DistributedCacheEntryOptions {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
        };
        await cache.SetStringAsync(key, value, options);
    }

    public async Task Handle(ChatMessageSentEvent notification, CancellationToken cancellationToken)
    {
        var chat = await context.Chats
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == notification.Message.ChatId, cancellationToken);

        if (chat != null)
        {
            chat.Messages.Add(new ChatMessage {
                Body = notification.Message.Body,
                SenderId = notification.Message.SenderId,
                State = notification.Message.State,
                ChatId = chat.Id,
                Guid = notification.Message.Guid
            });

            // Update the unread count (for instance, increase count for all recipients except the sender)
            chat.UnreadCount = chat.Messages.Count(m => m.State != MessageState.Read && m.SenderId != notification.Message.SenderId);

            // Update the last message field
            chat.LastMessage = notification.Message.Body;
            chat.LastMessageSenderId = notification.Message.SenderId;

            // Save the updated chat summary data
            await context.SaveChangesAsync(cancellationToken);

            var key = PENDING_MESSAGE_PREFIX + notification.Message.Guid;
            await cache.RemoveAsync(key, cancellationToken);
        }
    }
}