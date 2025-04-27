using System.Security.Claims;
using FadeChat.Application.User.Dtos;
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
            .MapGet(GetCurrentUser, "/me")
            .MapPost(CompleteSetup, "/setup");
    }

    private async Task<Ok<CurrentUserDto>> GetCurrentUser(ISender sender) =>
        TypedResults.Ok(await sender.Send(new GetCurrentUserQuery()));

    private async Task<IResult> CompleteSetup(
        [FromBody] SetupRequest request,
        IAccountService accountService,
        HttpContext context,
        UserManager<User> userManager,
        SignInManager<User> signInManager)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Results.Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Length < 3)
        {
            return Results.BadRequest(new {
                error = "Display name must be at least 3 characters"
            });
        }

        var success = await accountService.CompleteUserSetupAsync(userId, request.DisplayName);

        if (!success)
            return Results.BadRequest(new {
                error = "Failed to update user"
            });

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return Results.Problem("User disappeared?");

        await signInManager.RefreshSignInAsync(user);

        return Results.Ok(new {
            message = "Setup complete", returnUrl = string.IsNullOrEmpty(request.ReturnUrl) ? "/" : request.ReturnUrl
        });
    }

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
        var result = await context.AuthenticateAsync(IdentityConstants.ExternalScheme);

        if (!result.Succeeded)
        {
            return Results.Unauthorized();
        }

        var appPrincipal = await accountService.LoginWithExternalAsync(result.Principal, GoogleDefaults.AuthenticationScheme);

        await context.SignInAsync(IdentityConstants.ApplicationScheme, appPrincipal, result.Properties);

        await context.SignOutAsync(IdentityConstants.ExternalScheme);

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
        var result = await context.AuthenticateAsync(IdentityConstants.ExternalScheme);

        if (!result.Succeeded)
        {
            return Results.Unauthorized();
        }

        var appPrincipal = await accountService.LoginWithExternalAsync(result.Principal, FacebookDefaults.AuthenticationScheme);

        await context.SignInAsync(IdentityConstants.ApplicationScheme, appPrincipal, result.Properties);

        await context.SignOutAsync(IdentityConstants.ExternalScheme);

        return Results.Redirect(returnUrl);
    }

    private async Task<Results<Ok, ProblemHttpResult>> Logout(SignInManager<User> signInManager, HttpContext context)
    {
        try
        {
            await signInManager.SignOutAsync();
            await context.SignOutAsync(IdentityConstants.ApplicationScheme);
            return TypedResults.Ok();
        }
        catch (Exception)
        {
            return TypedResults.Problem("An error occurred during logout.", statusCode: 500);
        }
    }
}