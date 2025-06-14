using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace SpillTea.Application.User.Services;

using User = Domain.Entities.User;

public class AppUserClaimsPrincipalFactory(UserManager<User> userManager,
    RoleManager<IdentityRole> roleManager,
    IOptions<IdentityOptions> options) : UserClaimsPrincipalFactory<User, IdentityRole>(userManager, roleManager, options)
{
    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(User user)
    {
        var id = await base.GenerateClaimsAsync(user);

        if (!string.IsNullOrWhiteSpace(user.DisplayName))
            id.AddClaim(new Claim(CustomClaims.DisplayName, user.DisplayName));

        if (!string.IsNullOrWhiteSpace(user.Tag))
            id.AddClaim(new Claim(CustomClaims.Tag, user.Tag));

        if (user.Age.HasValue)
            id.AddClaim(new Claim(CustomClaims.Age, user.Age.Value.ToString()));

        if (!string.IsNullOrWhiteSpace(user.Gender))
            id.AddClaim(new Claim(CustomClaims.Gender, user.Gender));

        return id;
    }
}

public static class CustomClaims
{
    public const string DisplayName = "DisplayName";
    public const string Tag = "Tag";
    public const string Age = "Age";
    public const string Gender = "Gender";
}
