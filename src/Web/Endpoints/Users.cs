using FadeChat.Application.User.Interfaces;
using FadeChat.Application.User.Queries;
using FadeChat.Domain.Entities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Facebook;
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
            .MapIdentityApi<User>();

        app.MapGroup(this)
            .MapGet(LoginWithGoogle, "/google/login")
            .MapGet(GoogleLoginCallback, "/google/login/callback")
            .MapGet(LoginWithFacebook, "/facebook/login")
            .MapGet(FacebookLoginCallback, "/facebook/login/callback")
            .MapPost(Logout, "/logout");

        app.MapGroup(this)
            .RequireAuthorization()
            .MapGet(GetCurrentUser, "/me");
    }

    private async Task<Ok<CurrentUserDto>> GetCurrentUser(ISender sender) => TypedResults.Ok(await sender.Send(new GetCurrentUserQuery()));

    private IResult LoginWithGoogle(HttpContext context, LinkGenerator linkGenerator, SignInManager<User> signInManager, [FromQuery] string? returnUrl)
    {
        var callbackUrl = linkGenerator.GetPathByName(context, nameof(GoogleLoginCallback)) + $"?returnUrl={returnUrl}";
        var properties = signInManager.ConfigureExternalAuthenticationProperties(GoogleDefaults.AuthenticationScheme, callbackUrl);
        return Results.Challenge(properties, [
            GoogleDefaults.AuthenticationScheme
        ]);
    }

    private async Task<IResult> GoogleLoginCallback(IAccountService accountService, HttpContext context, [FromQuery] string returnUrl)
    {
        var result = await context.AuthenticateAsync(DependencyInjection.ExternalCookie);

        if (!result.Succeeded)
        {
            return Results.Unauthorized();
        }

        var appPrincipal = await accountService.LoginWithGoogleAsync(result.Principal);

        await context.SignInAsync(DependencyInjection.ApplicationScheme, appPrincipal, result.Properties);

        await context.SignOutAsync(DependencyInjection.ExternalCookie);

        return Results.Redirect(returnUrl);
    }

    private IResult LoginWithFacebook(HttpContext context, LinkGenerator linkGenerator, SignInManager<User> signInManager, [FromQuery] string? returnUrl)
    {
        var callbackUrl = linkGenerator.GetPathByName(context, nameof(FacebookLoginCallback)) + $"?returnUrl={returnUrl}";
        var properties = signInManager.ConfigureExternalAuthenticationProperties(FacebookDefaults.AuthenticationScheme, callbackUrl);
        return Results.Challenge(properties, [
            FacebookDefaults.AuthenticationScheme
        ]);
    }

    private async Task<IResult> FacebookLoginCallback(IAccountService accountService, HttpContext context, [FromQuery] string returnUrl)
    {
        var result = await context.AuthenticateAsync(DependencyInjection.ExternalCookie);

        if (!result.Succeeded)
        {
            return Results.Unauthorized();
        }

        var appPrincipal = await accountService.LoginWithFacebookAsync(result.Principal);

        await context.SignInAsync(DependencyInjection.ApplicationScheme, appPrincipal, result.Properties);

        await context.SignOutAsync(DependencyInjection.ExternalCookie);

        return Results.Redirect(returnUrl);
    }

    private async Task<Results<Ok, ProblemHttpResult>> Logout(SignInManager<User> signInManager, HttpContext context)
    {
        try
        {
            await signInManager.SignOutAsync();
            await context.SignOutAsync(DependencyInjection.ApplicationScheme);
            return TypedResults.Ok();
        }
        catch (Exception)
        {
            return TypedResults.Problem("An error occurred during logout.", statusCode: 500);
        }
    }
}