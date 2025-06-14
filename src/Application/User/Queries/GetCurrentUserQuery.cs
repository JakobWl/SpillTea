using SpillTea.Application.Common.Interfaces;
using SpillTea.Application.Common.Security;
using SpillTea.Application.User.Dtos;

namespace SpillTea.Application.User.Queries;

[Authorize]
public record GetCurrentUserQuery : IRequest<CurrentUserDto>;

public class GetCurrentUserQueryHandler(IUser user) : IRequestHandler<GetCurrentUserQuery, CurrentUserDto>
{
    public Task<CurrentUserDto> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken) =>
        Task.FromResult(new CurrentUserDto {
            Id = user.Id!,
            Name = user.Name!,
            Email = user.Email!,
            DisplayName = user.DisplayName,
            Tag = user.Tag,
            Age = user.Age,
            Gender = user.Gender
        });
}
