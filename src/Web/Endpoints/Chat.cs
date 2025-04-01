using FadeChat.Application.Chat.Models;
using FadeChat.Application.Common.Interfaces;
using FadeChat.Web.Infrastructure;
using Microsoft.AspNetCore.Authorization;

namespace FadeChat.Web.Endpoints;

[Authorize]
public class Chat : EndpointGroupBase
{
    public override void Map(WebApplication app)
    {
        app.MapGroup(this)
            .RequireAuthorization()
            .MapGet(GetRecentMessages)
            .MapPost(SendMessage);
    }

    public Task<IResult> GetRecentMessages(IIdentityService identityService)
    {
        // In a real implementation, this would retrieve messages from a database
        // For now, we're returning an empty list
        return Task.FromResult(Results.Ok(Array.Empty<ChatMessage>()));
    }

    public async Task<IResult> SendMessage(string message, IUser currentUser, IIdentityService identityService)
    {
        if (currentUser.Id == null)
            return Results.Unauthorized();

        var username = await identityService.GetUserNameAsync(currentUser.Id) ?? "Anonymous";

        var chatMessage = new ChatMessage
        {
            SenderId = currentUser.Id,
            SenderName = username,
            Content = message
        };

        // In a real implementation, this would store the message in a database
        
        return Results.Ok(chatMessage);
    }
}
