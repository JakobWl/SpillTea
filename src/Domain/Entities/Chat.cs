using System.ComponentModel.DataAnnotations.Schema;

namespace FadeChat.Domain.Entities;

public class Chat : BaseAuditableEntity
{
    public int UnreadCount { get; set; }
    [Encrypted]
    public string LastMessage { get; set; } = string.Empty;
    [InverseProperty(nameof(ChatMessage.Chat))]
    public virtual ICollection<ChatMessage> Messages { get; set; } = [];
    [InverseProperty(nameof(ApplicationUser.Chats))]
    public virtual ICollection<ApplicationUser> Users { get; set; } = [];
}