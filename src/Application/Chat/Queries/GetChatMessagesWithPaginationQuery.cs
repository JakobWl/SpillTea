using FadeChat.Application.Chat.Dtos;
using FadeChat.Application.Common.Interfaces;
using FadeChat.Application.Common.Models;

namespace FadeChat.Application.Chat.Queries;

public sealed record GetChatMessagesWithPaginationQuery(int ChatId = 1) : IRequest<PaginatedList<ChatMessageDto>>
{
    public int ChatId { get; init; } = ChatId;
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

public class GetChatMessagesWithPaginationQueryHandler(IApplicationDbContext context) : IRequestHandler<GetChatMessagesWithPaginationQuery, PaginatedList<ChatMessageDto>>
{
    public async Task<PaginatedList<ChatMessageDto>> Handle(GetChatMessagesWithPaginationQuery request, CancellationToken cancellationToken)
    {
        // Build the query and order by LastModified
        var query = context.ChatMessages.OrderBy(x => x.LastModified);

        // Retrieve the total count for pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Get the paginated list of Chat entities
        var chatMessages = await query
            .Where(x => x.ChatId == request.ChatId)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // Manually map each Chat entity to ChatDto
        var chatMessageDtos = chatMessages.Select(chatMessage => new ChatMessageDto {
            Id = chatMessage.Id,
            ChatId = chatMessage.ChatId,
            SenderId = chatMessage.SenderId,
            Body = chatMessage.Body,
            State = chatMessage.State,
            TimeStamp = chatMessage.Created
        }).ToList();

        // Create and return the paginated list
        return new PaginatedList<ChatMessageDto>(chatMessageDtos, totalCount, request.PageNumber, request.PageSize);
    }
}