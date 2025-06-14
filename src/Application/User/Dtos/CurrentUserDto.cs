namespace SpillTea.Application.User.Dtos;

public class CurrentUserDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? DisplayName { get; init; }
    public string? Tag { get; init; }
    public int? Age { get; init; }
    public string? Gender { get; init; }
    public bool SetupComplete => !string.IsNullOrWhiteSpace(Tag) && Age.HasValue && Gender != null;
}
