using FadeChat.Application.User.Interfaces;
using FadeChat.Application.User.Queries;
using FadeChat.Domain.Entities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace FadeChat.Web.Endpoints;

public class Users : EndpointGroupBase
{
    public override void Map(WebApplication app)
    {
        app.MapGroup(this)
            .RequireAuthorization()
            .MapGet(GetCurrentUser);

        app.MapGroup(this).MapIdentityApi<User>();

        app.MapGroup(this).MapGet(LoginWithGoogle, "/google/login");
        app.MapGroup(this).MapGet(GoogleLoginCallback, "/google/login/callback");
    }

    private async Task<Ok<CurrentUserDto>> GetCurrentUser(ISender sender) => TypedResults.Ok(await sender.Send(new GetCurrentUserQuery()));

    private IResult LoginWithGoogle(HttpContext context, LinkGenerator linkGenerator, SignInManager<User> signInManager, [FromQuery] string? returnUrl)
    {
        var properties = signInManager.ConfigureExternalAuthenticationProperties("Google",
            linkGenerator.GetPathByName(context, nameof(GoogleLoginCallback))
            + $"?returnUrl={returnUrl}");

        return Results.Challenge(properties, [
            "Google"
        ]);
    }

    private async Task<IResult> GoogleLoginCallback(IAccountService accountService, HttpContext context, [FromQuery] string returnUrl)
    {
        var result = await context.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

        if (!result.Succeeded)
        {
            return Results.Unauthorized();
        }

        await accountService.LoginWithGoogleAsync(result.Principal);

        return Results.Redirect(returnUrl);
    }
}