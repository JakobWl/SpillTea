using System.Security.Claims;
using FadeChat.Application.User.Services;

namespace FadeChat.Application.User.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string? GetTag(this ClaimsPrincipal claimsPrincipal) => GetClaimValue(claimsPrincipal, CustomClaims.Tag);

    private static string? GetClaimValue(ClaimsPrincipal? claimsPrincipal, params string[] claimNames)
    {
        ArgumentNullException.ThrowIfNull(claimsPrincipal);

        return claimNames.Select(claimsPrincipal.FindFirstValue)
            .FirstOrDefault(currentValue => !string.IsNullOrEmpty(currentValue));
    }
}