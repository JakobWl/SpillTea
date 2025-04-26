using Azure.Identity;
using FadeChat.Application.Common.Interfaces;
using FadeChat.Infrastructure.Data;
using FadeChat.Web.Nswag;
using FadeChat.Web.Services;
using Microsoft.AspNetCore.Mvc;
using NSwag;
using NSwag.Generation.Processors.Security;

namespace FadeChat.Web;

public static class DependencyInjection
{
    public static readonly string ApplicationScheme = "Application";
    public static readonly string ExternalCookie = "External";

    public static void AddWebServices(this IHostApplicationBuilder builder)
    {
        builder.Services.AddDatabaseDeveloperPageExceptionFilter();

        builder.Services.AddScoped<IUser, CurrentUser>();

        builder.Services.AddHttpContextAccessor();
        builder.Services.AddHealthChecks()
            .AddDbContextCheck<ApplicationDbContext>();

        builder.Services.AddExceptionHandler<CustomExceptionHandler>();

        // Add SignalR
        builder.Services.AddSignalR();

        // Configure Authentication
        builder.Services.AddAuthentication(opt =>
            {
                opt.DefaultScheme = ApplicationScheme;
                opt.DefaultAuthenticateScheme = ApplicationScheme;
                opt.DefaultChallengeScheme = ApplicationScheme;
                opt.DefaultSignInScheme = ApplicationScheme;
            })
            .AddCookie(ApplicationScheme, options =>
            {
                options.Cookie.SameSite = SameSiteMode.None;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.LoginPath = "/api/Users/login";
                options.LogoutPath = "/api/Users/logout";

                options.Events.OnRedirectToLogin = ctx =>
                {
                    if (ctx.Request.Path.StartsWithSegments("/api"))
                    {
                        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return Task.CompletedTask;
                    }
                    ctx.Response.Redirect(ctx.RedirectUri);
                    return Task.CompletedTask;
                };
            })
            .AddCookie(ExternalCookie, options =>
            {
                options.Cookie.Name = "ExternalOAuth";
                options.ExpireTimeSpan = TimeSpan.FromMinutes(5);
            })
            .AddGoogle(options =>
            {
                options.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
                options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
                options.SignInScheme = ExternalCookie;
            })
            .AddFacebook(options =>
            {
                options.AppId = builder.Configuration["Authentication:Facebook:AppId"]!;
                options.AppSecret = builder.Configuration["Authentication:Facebook:AppSecret"]!;
                options.SignInScheme = ExternalCookie;
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
            configure.AddSecurity("oauth2", new OpenApiSecurityScheme {
                Type = OpenApiSecuritySchemeType.OAuth2,
                Flows = new OpenApiOAuthFlows {
                    AuthorizationCode = new OpenApiOAuthFlow {
                        AuthorizationUrl = $"{builder.Configuration["Authentication:OIDC:Authority"]}/connect/authorize",
                        TokenUrl = $"{builder.Configuration["Authentication:OIDC:Authority"]}/connect/token",
                        Scopes = new Dictionary<string, string> {
                            {
                                "openid", "OpenID"
                            }, {
                                "profile", "Profile"
                            }, {
                                "email", "Email"
                            }
                        }
                    }
                }
            });
            configure.OperationProcessors.Add(new AspNetCoreOperationSecurityScopeProcessor("oauth2"));
            configure.SchemaSettings.SchemaProcessors.Add(new NonNullableToRequiredSchemaProcessor());
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