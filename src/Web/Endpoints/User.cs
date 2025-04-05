using FadeChat.Application.User.Queries;
using Microsoft.AspNetCore.Http.HttpResults;

namespace FadeChat.Web.Endpoints;

public class User : EndpointGroupBase
{
    public override void Map(WebApplication app)
    {
        app.MapGroup(this)
            .RequireAuthorization()
            .MapGet(GetCurrentUser);
    }

    public async Task<Ok<CurrentUserDto>> GetCurrentUser(ISender sender)
    {
        return TypedResults.Ok(await sender.Send(new GetCurrentUserQuery()));
    }
}
