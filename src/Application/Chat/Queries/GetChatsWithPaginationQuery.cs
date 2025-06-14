using SpillTea.Application.Chat.Dtos;
using SpillTea.Application.Common.Interfaces;
using SpillTea.Application.Common.Models;

namespace SpillTea.Application.Chat.Queries;

public sealed record GetChatsWithPaginationQuery : IRequest<PaginatedList<ChatDto>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

public class GetChatsWithPaginationQueryHandler(IApplicationDbContext context) : IRequestHandler<GetChatsWithPaginationQuery, PaginatedList<ChatDto>>
{
    public async Task<PaginatedList<ChatDto>> Handle(GetChatsWithPaginationQuery request, CancellationToken cancellationToken)
    {
        // Build the query and order by LastModified
        var query = context.Chats.OrderByDescending(x => x.LastModified);

        // Retrieve the total count for pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Get the paginated list of Chat entities
        var chats = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // Manually map each Chat entity to ChatDto
        var chatDtos = chats.Select(chat => new ChatDto {
            Id = chat.Id,
            UnreadCount = chat.UnreadCount, // Ensure this value is set correctly,
            // possibly add any business logic if needed
            LastModified = chat.LastModified,
            LastMessage = chat.LastMessage // You could include additional logic here
        }).ToList();

        // Create and return the paginated list
        return new PaginatedList<ChatDto>(chatDtos, totalCount, request.PageNumber, request.PageSize);
    }
}
