using SpillTea.Application.Chat.Dtos;
using SpillTea.Application.Common.Interfaces;
using SpillTea.Application.Common.Models;

namespace SpillTea.Application.Chat.Queries;

public sealed record GetChatMessagesWithPaginationQuery(int ChatId = 1, int PageNumber = 1, int PageSize = 10) : IRequest<PaginatedList<ChatMessageDto>>;

public class GetChatMessagesWithPaginationQueryHandler(IApplicationDbContext context) : IRequestHandler<GetChatMessagesWithPaginationQuery, PaginatedList<ChatMessageDto>>
{
    public async Task<PaginatedList<ChatMessageDto>> Handle(GetChatMessagesWithPaginationQuery request, CancellationToken cancellationToken)
    {
        // Build the query and order by LastModified
        var query = context.ChatMessages.OrderByDescending(x => x.LastModified);

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
        }).OrderBy(x => x.TimeStamp).ToList();

        // Create and return the paginated list
        return new PaginatedList<ChatMessageDto>(chatMessageDtos, totalCount, request.PageNumber, request.PageSize);
    }
}
