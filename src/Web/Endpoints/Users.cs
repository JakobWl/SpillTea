using FadeChat.Application.User.Queries;
using FadeChat.Domain.Entities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace FadeChat.Web.Endpoints;

public class Users : EndpointGroupBase
{
    public override void Map(WebApplication app)
    {
        app.MapGroup(this)
            .RequireAuthorization()
            .MapGet(GetCurrentUser);

        app.MapGroup(this).MapIdentityApi<ApplicationUser>();

        app.MapGroup(this).MapGet(LoginWithGoogle, "/google/login");

        app.MapGroup(this).MapPost(LogoutUser, "/cookie-logout");
    }

    private async Task<Ok<CurrentUserDto>> GetCurrentUser(ISender sender) => TypedResults.Ok(await sender.Send(new GetCurrentUserQuery()));

    private ChallengeHttpResult LoginWithGoogle(HttpContext context, [FromQuery] string? returnUrl)
    {
        var redirectUri = !string.IsNullOrEmpty(returnUrl) ? returnUrl : "/";

        var properties = new AuthenticationProperties {
            RedirectUri = redirectUri
        };

        return TypedResults.Challenge(properties, new List<string> {
            GoogleDefaults.AuthenticationScheme
        });
    }

    private async Task<Ok<string>> LogoutUser(HttpContext context)
    {
        await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        return TypedResults.Ok("Logout successful");
    }
}