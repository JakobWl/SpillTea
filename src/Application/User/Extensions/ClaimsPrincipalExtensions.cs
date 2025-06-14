using System.Security.Claims;
using SpillTea.Application.User.Services;

namespace SpillTea.Application.User.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string? GetDisplayName(this ClaimsPrincipal claimsPrincipal) => GetClaimValue(claimsPrincipal, CustomClaims.DisplayName);

    public static string? GetTag(this ClaimsPrincipal claimsPrincipal) => GetClaimValue(claimsPrincipal, CustomClaims.Tag);

    public static int? GetAge(this ClaimsPrincipal claimsPrincipal)
    {
        var ageString = GetClaimValue(claimsPrincipal, CustomClaims.Age);
        return int.TryParse(ageString, out var age) ? age : null;
    }

    public static string? GetGender(this ClaimsPrincipal claimsPrincipal) => GetClaimValue(claimsPrincipal, CustomClaims.Gender);

    private static string? GetClaimValue(ClaimsPrincipal? claimsPrincipal, params string[] claimNames)
    {
        ArgumentNullException.ThrowIfNull(claimsPrincipal);

        return claimNames.Select(claimsPrincipal.FindFirstValue)
            .FirstOrDefault(currentValue => !string.IsNullOrEmpty(currentValue));
    }
}
