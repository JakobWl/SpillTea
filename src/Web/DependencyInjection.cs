using Azure.Identity;
using FadeChat.Application.Common.Interfaces;
using FadeChat.Infrastructure.Data;
using FadeChat.Web.Services;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;

namespace FadeChat.Web;

public static class DependencyInjection
{
    public static void AddWebServices(this IHostApplicationBuilder builder)
    {
        builder.Services.AddDatabaseDeveloperPageExceptionFilter();

        builder.Services.AddScoped<IUser, CurrentUser>();

        builder.Services.AddHttpContextAccessor();
        builder.Services.AddHealthChecks()
            .AddDbContextCheck<ApplicationDbContext>();

        builder.Services.AddExceptionHandler<CustomExceptionHandler>();

        builder.Services.AddRazorPages();

        // Add SignalR
        builder.Services.AddSignalR();

        // Configure Authentication
        builder.Services.AddAuthentication()
            .AddBearerToken(IdentityConstants.BearerScheme, options =>
            {
                options.Events = new BearerTokenEvents
                {
                    OnMessageReceived = context =>
                    {
                        StringValues accessToken = context.Request.Query["access_token"];

                        PathString path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) &&
                            path.StartsWithSegments("/hubs/"))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            })
            .AddGoogle(googleOptions =>
            {
                googleOptions.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
                googleOptions.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
            })
            .AddFacebook(facebookOptions =>
            {
                facebookOptions.AppId = builder.Configuration["Authentication:Facebook:AppId"]!;
                facebookOptions.AppSecret = builder.Configuration["Authentication:Facebook:AppSecret"]!;
            });

        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(configurePolicy =>
            {
                configurePolicy
                    .WithOrigins(builder.Configuration.GetSection("CorsOrigins").Get<string[]>() ?? [])
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        // Customise default API behaviour
        builder.Services.Configure<ApiBehaviorOptions>(options =>
            options.SuppressModelStateInvalidFilter = true);

        builder.Services.AddEndpointsApiExplorer();

        builder.Services.AddOpenApiDocument((configure, _) =>
        {
            configure.Title = "FadeChat API";
            configure.AddSecurity("oauth2", new NSwag.OpenApiSecurityScheme
            {
                Type = NSwag.OpenApiSecuritySchemeType.OAuth2,
                Flows = new NSwag.OpenApiOAuthFlows
                {
                    AuthorizationCode = new NSwag.OpenApiOAuthFlow
                    {
                        AuthorizationUrl = $"{builder.Configuration["Authentication:OIDC:Authority"]}/connect/authorize",
                        TokenUrl = $"{builder.Configuration["Authentication:OIDC:Authority"]}/connect/token",
                        Scopes = new Dictionary<string, string>
                        {
                            { "openid", "OpenID" },
                            { "profile", "Profile" },
                            { "email", "Email" }
                        }
                    }
                }
            });
            configure.OperationProcessors.Add(new NSwag.Generation.Processors.Security.AspNetCoreOperationSecurityScopeProcessor("oauth2"));
        });
    }

    public static void AddKeyVaultIfConfigured(this IHostApplicationBuilder builder)
    {
        var keyVaultUri = builder.Configuration["AZURE_KEY_VAULT_ENDPOINT"];
        if (!string.IsNullOrWhiteSpace(keyVaultUri))
        {
            builder.Configuration.AddAzureKeyVault(
                new Uri(keyVaultUri),
                new DefaultAzureCredential());
        }
    }
}
