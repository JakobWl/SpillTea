namespace FadeChat.Application.Chat.Dtos;

public class SearchFiltersDto
{
    public bool AgeRangeEnabled { get; set; } = false;
    public int MinAge { get; set; } = 18;
    public int MaxAge { get; set; } = 100;
    public List<string> GenderPreferences { get; set; } = new();
    public bool SameAgeGroupOnly { get; set; } = false;
}