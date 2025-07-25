namespace SpillTea.Application.User.Dtos;

public record RegisterRequest
{
    public required string UserName { get; init; }
    public required string Email { get; init; }
    public required string Password { get; init; }
}
