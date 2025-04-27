using System.Security.Claims;
using FadeChat.Application.Common.Exceptions;
using FadeChat.Application.Common.Interfaces;
using FadeChat.Application.User.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace FadeChat.Application.User.Services;

using User = Domain.Entities.User;

public class AccountService(UserManager<User> userManager, SignInManager<User> signInManager, IApplicationDbContext context) : IAccountService
{
    public async Task<ClaimsPrincipal> LoginWithExternalAsync(
        ClaimsPrincipal? claimsPrincipal,
        string providerScheme)
    {
        if (claimsPrincipal == null)
            throw new ExternalLoginProviderException(providerScheme, "ClaimsPrincipal is null");

        // 1) extract the key & email
        var providerKey = claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? throw new ExternalLoginProviderException(providerScheme, "NameIdentifier claim not found");
        var email = claimsPrincipal.FindFirstValue(ClaimTypes.Email)
                    ?? throw new ExternalLoginProviderException(providerScheme, "Email claim not found");

        // 2) try to find an existing user by this external login
        var user = await userManager.FindByLoginAsync(providerScheme, providerKey);

        if (user != null)
            return await signInManager.CreateUserPrincipalAsync(user);

        if (user == null)
        {
            // 4) still nothing? create a new user
            user = new User {
                Email = email, UserName = "user_" + Guid.NewGuid().ToString("N"), EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(user);
            if (!createResult.Succeeded)
                throw new ExternalLoginProviderException(
                    providerScheme,
                    $"Unable to create user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}"
                );
        }

        // 5) link the external login
        var info = new UserLoginInfo(providerScheme, providerKey, providerScheme);
        var loginResult = await userManager.AddLoginAsync(user, info);
        if (!loginResult.Succeeded)
            throw new ExternalLoginProviderException(
                providerScheme,
                $"Unable to add login: {string.Join(", ", loginResult.Errors.Select(e => e.Description))}"
            );

        // 6) finally build the ClaimsPrincipal for ASP.NET Identity
        return await signInManager.CreateUserPrincipalAsync(user);
    }

    public async Task<bool> IsUserSetupComplete(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        return !string.IsNullOrEmpty(user.DisplayName) && !string.IsNullOrEmpty(user.Tag);
    }

    public async Task<bool> CompleteUserSetupAsync(string userId, string displayName)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        var tag = await GenerateUniqueTagAsync(displayName);

        user.DisplayName = displayName;
        user.Tag = tag;

        user.UserName = $"{displayName}#{tag}";

        var result = await userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    private async Task<string> GenerateUniqueTagAsync(string displayName)
    {
        var rng = new Random();
        string tag;
        do
        {
            tag = rng.Next(0, 10000).ToString("D4"); // e.g. "0042", "8372"
        } while (await context.Users
                     .AnyAsync(u => u.DisplayName == displayName && u.Tag == tag));

        return tag;
    }
}