using System.ComponentModel.DataAnnotations.Schema;

namespace FadeChat.Domain.Entities;

public class Chat : BaseAuditableEntity
{
    public int UnreadCount { get; set; }
    [Encrypted]
    public string LastMessage { get; set; } = string.Empty;
    public string LastMessageSenderId { get; set; } = null!;
    [InverseProperty(nameof(ChatMessage.Chat))]
    public virtual ICollection<ChatMessage> Messages { get; set; } = [];
    [InverseProperty(nameof(User.Chats))]
    public virtual ICollection<User> Users { get; set; } = [];
}