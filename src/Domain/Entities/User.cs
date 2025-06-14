using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace SpillTea.Domain.Entities;

public class User : IdentityUser
{
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAtUtc { get; set; }

    [MaxLength(50)]
    public string? DisplayName { get; set; }

    [MaxLength(4)]
    public string? Tag { get; set; }

    public int? Age { get; set; }

    [MaxLength(20)]
    public string? Gender { get; set; }

    [InverseProperty(nameof(Chat.Users))]
    public ICollection<Chat> Chats { get; set; } = null!;

    public static User Create(string email, string userName) =>
        new()
        {
            Email = email,
            UserName = userName
        };
}
