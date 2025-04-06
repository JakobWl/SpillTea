using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace FadeChat.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    [InverseProperty(nameof(Chat.Users))]
    public ICollection<Chat> Chats { get; set; } = null!;
}