using FadeChat.Application.Chat.Dtos;
using FadeChat.Application.Chat.Queries;
using FadeChat.Application.Common.Models;
using Microsoft.AspNetCore.Http.HttpResults;

namespace FadeChat.Web.Endpoints;

public class Chats : EndpointGroupBase
{
    public override void Map(WebApplication app) =>
        app.MapGroup(this)
            .RequireAuthorization()
            .MapGet(GetChats)
            .MapGet(GetChatMessages, "{chatId}");

    private async Task<Ok<PaginatedList<ChatDto>>> GetChats(ISender sender) => TypedResults.Ok(await sender.Send(new GetChatsWithPaginationQuery()));

    private async Task<Ok<PaginatedList<ChatMessageDto>>> GetChatMessages(ISender sender, int chatId) => TypedResults.Ok(await sender.Send(new GetChatMessagesWithPaginationQuery(chatId)));
}