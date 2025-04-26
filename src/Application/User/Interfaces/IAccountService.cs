using System.Security.Claims;

namespace FadeChat.Application.User.Interfaces;

public interface IAccountService
{
    Task<ClaimsPrincipal> LoginWithGoogleAsync(ClaimsPrincipal? claimsPrincipal);
    Task<ClaimsPrincipal> LoginWithFacebookAsync(ClaimsPrincipal? claimsPrincipal);
}