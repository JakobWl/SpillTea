namespace FadeChat.Application.User.Dtos;

public record LoginRequest
{
    public required string Email { get; init; }
    public required string Password { get; init; }
}