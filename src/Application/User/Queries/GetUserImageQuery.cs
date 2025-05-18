using FadeChat.Application.Common.Security;

namespace FadeChat.Application.User.Queries;

[Authorize]
public record GetUserImageQuery(string UserId) : IRequest<string>;

public class GetUserImageQueryHandler : IRequestHandler<GetUserImageQuery, string>
{
    private const string DefaultImageUrl = "https://cdn.example.com/images/default-avatar.png";

    public Task<string> Handle(GetUserImageQuery request, CancellationToken cancellationToken)
    {
        if (request.UserId == "")
        {
            return Task.FromResult("");
        }
        return Task.FromResult(DefaultImageUrl);
    }
}