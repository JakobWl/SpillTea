namespace FadeChat.Application.User.Dtos;

public class SetupRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string ReturnUrl { get; set; } = "/";
}