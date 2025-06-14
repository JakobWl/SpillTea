using SpillTea.Application.Chat.Dtos;
using SpillTea.Application.Chat.Queries;
using SpillTea.Application.Common.Models;
using Microsoft.AspNetCore.Http.HttpResults;

namespace SpillTea.Web.Endpoints;

public class Chats : EndpointGroupBase
{
    public override void Map(WebApplication app) =>
        app.MapGroup(this)
            .RequireAuthorization()
            .MapGet(GetChats)
            .MapGet(GetChatMessages, "{chatId}");

    private async Task<Ok<PaginatedList<ChatDto>>> GetChats(ISender sender) => TypedResults.Ok(await sender.Send(new GetChatsWithPaginationQuery()));

    private async Task<Ok<PaginatedList<ChatMessageDto>>> GetChatMessages(ISender sender, int chatId, int pageSize, int pageNumber) => TypedResults.Ok(await sender.Send(new GetChatMessagesWithPaginationQuery(chatId, pageSize, pageNumber)));
}
