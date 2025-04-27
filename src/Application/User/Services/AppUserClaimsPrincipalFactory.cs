using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace FadeChat.Application.User.Services;

using User = Domain.Entities.User;

public class AppUserClaimsPrincipalFactory(UserManager<User> userManager,
    RoleManager<IdentityRole> roleManager,
    IOptions<IdentityOptions> options) : UserClaimsPrincipalFactory<User, IdentityRole>(userManager, roleManager, options)
{
    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(User user)
    {
        var id = await base.GenerateClaimsAsync(user);

        if (!string.IsNullOrWhiteSpace(user.Tag))
            id.AddClaim(new Claim(CustomClaims.Tag, user.Tag));

        return id;
    }
}

public static class CustomClaims
{
    public const string Tag = "Tag";
}