using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FadeChat.Application.User.Dtos;
using FadeChat.Application.User.Interfaces;
using FadeChat.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FadeChat.Infrastructure.Processors;

public class AuthTokenProcessor(IOptions<JwtOptions> jwtOptions, IHttpContextAccessor httpContextAccessor) : IAuthTokenProcessor
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public (string jwtToken, DateTime expiresAtUtc) GenerateJwtToken(User user)
    {
        var signingKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_jwtOptions.Secret));

        var credentials = new SigningCredentials(
            signingKey,
            SecurityAlgorithms.HmacSha256);

        var claims = new[] {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id), new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), new Claim(JwtRegisteredClaimNames.Email, user.Email!), new Claim(ClaimTypes.NameIdentifier, user.ToString())
        };

        var expires = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpirationTimeInMinutes);

        var token = new JwtSecurityToken(
            _jwtOptions.Issuer,
            _jwtOptions.Audience,
            claims,
            expires: expires,
            signingCredentials: credentials);

        var jwtToken = new JwtSecurityTokenHandler().WriteToken(token);

        return (jwtToken, expires);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public void WriteAuthTokenAsHttpOnlyCookie(string cookieName, string token, DateTime expiration)
    {
        var cookieOptions = GetCookieOptions(expiration);
        httpContextAccessor.HttpContext?.Response.Cookies.Append(cookieName, token, cookieOptions);
    }

    public void ClearAuthTokenCookie(string cookieName)
    {
        var cookieOptions = GetCookieOptions(DateTime.UtcNow.AddDays(-1));
        httpContextAccessor.HttpContext?.Response.Cookies.Append(cookieName, "", cookieOptions);
        httpContextAccessor.HttpContext?.Response.Cookies.Delete(cookieName, cookieOptions);
    }

    private static CookieOptions GetCookieOptions(DateTime expiration)
    {
        return new CookieOptions {
            HttpOnly = true,
            Expires = expiration,
            IsEssential = true,
            Secure = true,
            SameSite = SameSiteMode.None
        };
    }
}