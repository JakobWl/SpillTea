using System.Security.Claims;
using FadeChat.Application.Common.Exceptions;
using FadeChat.Application.User.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace FadeChat.Application.User.Services;

using User = Domain.Entities.User;

public class AccountService(IAuthTokenProcessor authTokenProcessor, UserManager<User> userManager, SignInManager<User> signInManager) : IAccountService
{
    public async Task LoginWithGoogleAsync(ClaimsPrincipal? claimsPrincipal)
    {
        if (claimsPrincipal == null)
        {
            throw new ExternalLoginProviderException("Google", "ClaimsPrincipal is null");
        }

        var email = claimsPrincipal.FindFirstValue(ClaimTypes.Email);

        if (email == null)
        {
            throw new ExternalLoginProviderException("Google", "Email is null");
        }

        var user = await userManager.FindByEmailAsync(email);

        if (user == null)
        {
            var newUser = new User {
                Email = email,
                UserName = claimsPrincipal.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(newUser);

            if (!result.Succeeded)
            {
                throw new ExternalLoginProviderException("Google",
                    $"Unable to create user: {string.Join(", ",
                        result.Errors.Select(x => x.Description))}");
            }



            user = newUser;
        }

        var info = new UserLoginInfo("Google",
            claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty,
            "Google");

        var existingLogins = await userManager.GetLoginsAsync(user);
        if (!existingLogins.Any(l => l.LoginProvider == info.LoginProvider && l.ProviderKey == info.ProviderKey))
        {
            var loginResult = await userManager.AddLoginAsync(user, info);
            if (!loginResult.Succeeded)
            {
                throw new ExternalLoginProviderException("Google",
                    $"Unable to add login: {string.Join(", ",
                        loginResult.Errors.Select(x => x.Description))}");
            }
        }

        var (jwtToken, expirationDateInUtc) = authTokenProcessor.GenerateJwtToken(user);
        var refreshTokenValue = authTokenProcessor.GenerateRefreshToken();

        var refreshTokenExpirationDateInUtc = DateTime.UtcNow.AddDays(7);

        user.RefreshToken = refreshTokenValue;
        user.RefreshTokenExpiresAtUtc = refreshTokenExpirationDateInUtc;

        await userManager.UpdateAsync(user);

        authTokenProcessor.WriteAuthTokenAsHttpOnlyCookie("ACCESS_TOKEN", jwtToken, expirationDateInUtc);
        authTokenProcessor.WriteAuthTokenAsHttpOnlyCookie("REFRESH_TOKEN", user.RefreshToken, refreshTokenExpirationDateInUtc);
    }

    public async Task LogoutAsync()
    {
        await signInManager.SignOutAsync();

        authTokenProcessor.ClearAuthTokenCookie("ACCESS_TOKEN");
        authTokenProcessor.ClearAuthTokenCookie("REFRESH_TOKEN");
    }
}