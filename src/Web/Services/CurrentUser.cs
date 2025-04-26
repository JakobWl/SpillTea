using System.Security.Claims;
using FadeChat.Application.Common.Interfaces;

namespace FadeChat.Web.Services;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : IUser
{
    public string? Id => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
    public string? Email => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email);
    public string? Name => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Name);
}
