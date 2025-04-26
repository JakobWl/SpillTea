using System.Security.Claims;

namespace FadeChat.Application.User.Interfaces;

public interface IAccountService
{
    Task LoginWithGoogleAsync(ClaimsPrincipal? claimsPrincipal);
    Task LogoutAsync();
}