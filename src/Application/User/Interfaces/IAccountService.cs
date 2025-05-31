using System.Security.Claims;

namespace FadeChat.Application.User.Interfaces;

public interface IAccountService
{
    Task<ClaimsPrincipal> LoginWithExternalAsync(ClaimsPrincipal? claimsPrincipal, string providerScheme);
    Task<bool> IsUserSetupComplete(string userId);
    Task<bool> CompleteUserSetupAsync(string userId, string displayName, int? age, string? gender);
    Task<bool> UpdateUserDemographicsAsync(string userId, int? age, string? gender);
}