using FadeChat.Application.Chat.Dtos;
using FadeChat.Application.Chat.Queries;
using FadeChat.Application.Common.Models;
using Microsoft.AspNetCore.Http.HttpResults;

namespace FadeChat.Web.Endpoints;

public class Chat : EndpointGroupBase
{
    public override void Map(WebApplication app) =>
        app.MapGroup(this)
            .RequireAuthorization()
            .MapGet(GetChats);

    private async Task<Ok<PaginatedList<ChatDto>>> GetChats(ISender sender) => TypedResults.Ok(await sender.Send(new GetChatsWithPaginationQuery()));
}