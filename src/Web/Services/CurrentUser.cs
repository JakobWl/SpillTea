using System.Security.Claims;
using FadeChat.Application.Common.Interfaces;
using FadeChat.Application.User.Extensions;

namespace FadeChat.Web.Services;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : IUser
{
    public string? Id => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
    public string? Email => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email);
    public string? Name => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Name);
    public string? DisplayName => httpContextAccessor.HttpContext?.User.GetDisplayName();
    public string? Tag => httpContextAccessor.HttpContext?.User.GetTag();
    public int? Age => httpContextAccessor.HttpContext?.User.GetAge();
    public string? Gender => httpContextAccessor.HttpContext?.User.GetGender();
}