using FadeChat.Application.Common.Interfaces;
using FadeChat.Application.Common.Security;

namespace FadeChat.Application.User.Queries;

[Authorize]
public record GetCurrentUserQuery : IRequest<CurrentUserDto>;

public class GetCurrentUserQueryHandler(IUser user) : IRequestHandler<GetCurrentUserQuery, CurrentUserDto>
{
    public Task<CurrentUserDto> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        return Task.FromResult(new CurrentUserDto
        {
            Id = user.Id!, Name = user.Name!, Email = user.Email!

        });
    }
}
