using FadeChat.Application.Chat.Models;
using FadeChat.Application.Common.Interfaces;

namespace FadeChat.Web.Endpoints;

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
        {
            return Results.Unauthorized();
        }

        string username = await identityService.GetUserNameAsync(currentUser.Id) ?? "Anonymous";

        ChatMessage chatMessage = new()
        {
            SenderId = currentUser.Id, SenderName = username, Content = message
        };

        // In a real implementation, this would store the message in a database

        return Results.Ok(chatMessage);
    }
}
