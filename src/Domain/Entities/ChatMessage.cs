using System.ComponentModel.DataAnnotations.Schema;

namespace FadeChat.Domain.Entities;

public class ChatMessage : BaseAuditableEntity
{
    public string Guid { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    [Encrypted]
    public string Body { get; set; } = string.Empty;
    public int ChatId { get; set; }
    public MessageState State { get; set; }
    [ForeignKey(nameof(ChatId))]
    [InverseProperty(nameof(Entities.Chat.Messages))]
    public Chat Chat { get; set; } = null!;
}

public enum MessageState
{
    Sent,
    Received,
    Read,
    Error
}