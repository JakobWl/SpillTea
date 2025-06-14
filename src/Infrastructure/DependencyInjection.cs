using SpillTea.Application.Common.Interfaces;
using SpillTea.Application.User.Services;
using SpillTea.Domain.Constants;
using SpillTea.Domain.Entities;
using SpillTea.Infrastructure.Data;
using SpillTea.Infrastructure.Data.Encryption;
using SpillTea.Infrastructure.Data.Encryption.Interfaces;
using SpillTea.Infrastructure.Data.Interceptors;
using SpillTea.Infrastructure.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace SpillTea.Infrastructure;

public static class DependencyInjection
{
    public static void AddInfrastructureServices(this IHostApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("SpillTeaDb");
        Guard.Against.Null(connectionString, message: "Connection string 'SpillTeaDb' not found.");

        builder.Services.AddScoped<ISaveChangesInterceptor, AuditableEntityInterceptor>();
        builder.Services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();
        builder.Services.AddSingleton<IStringEncryptionProvider, GenerateStringEncryptionProvider>();
        builder.Services.AddSingleton<IBinaryEncryptionProvider, GenerateBinaryEncryptionProvider>();
        builder.Services.AddSingleton<IStorageEncryptionProvider, StorageEncryptionProvider>();

        builder.Services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            options.AddInterceptors(sp.GetServices<ISaveChangesInterceptor>());
            options.UseSqlServer(connectionString);
        });

        builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

        builder.Services.AddScoped<ApplicationDbContextInitialiser>();

        builder.Services.Configure<IdentityOptions>(options =>
        {
            options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+#";
        });

        builder.Services.AddScoped<IUserClaimsPrincipalFactory<User>, AppUserClaimsPrincipalFactory>();

        builder.Services
            .AddDefaultIdentity<User>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddClaimsPrincipalFactory<AppUserClaimsPrincipalFactory>();

        builder.Services.ConfigureApplicationCookie(opts =>
        {
            opts.Cookie.Name = "SpillTea.Cookie";
            opts.Cookie.SameSite = SameSiteMode.None;
            opts.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            opts.LoginPath = "/api/Users/login";
            opts.LogoutPath = "/api/Users/logout";
            opts.Events.OnRedirectToLogin = ctx =>
            {
                if (ctx.Request.Path.StartsWithSegments("/api"))
                {
                    ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                }
                ctx.Response.Redirect(ctx.RedirectUri);
                return Task.CompletedTask;
            };
        });

        builder.Services.AddSingleton(TimeProvider.System);
        builder.Services.AddTransient<IIdentityService, IdentityService>();

        builder.Services.Configure<CryptographyOptions>(builder.Configuration.GetSection("Cryptography"));

        builder.Services.AddAuthorization(options =>
            options.AddPolicy(Policies.CanPurge, policy => policy.RequireRole(Roles.Administrator)));
    }
}
