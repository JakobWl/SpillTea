namespace SpillTea.Application.User.Dtos;

public class SetupRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public int? Age { get; set; }
    public string? Gender { get; set; }
}
