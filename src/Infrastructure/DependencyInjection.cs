using FadeChat.Application.Common.Interfaces;
using FadeChat.Application.User.Interfaces;
using FadeChat.Domain.Constants;
using FadeChat.Domain.Entities;
using FadeChat.Infrastructure.Data;
using FadeChat.Infrastructure.Data.Encryption;
using FadeChat.Infrastructure.Data.Encryption.Interfaces;
using FadeChat.Infrastructure.Data.Interceptors;
using FadeChat.Infrastructure.Identity;
using FadeChat.Infrastructure.Processors;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace FadeChat.Infrastructure;

public static class DependencyInjection
{
    public static void AddInfrastructureServices(this IHostApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("FadeChatDb");
        Guard.Against.Null(connectionString, message: "Connection string 'FadeChatDb' not found.");

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
        builder.Services.AddScoped<IAuthTokenProcessor, AuthTokenProcessor>();

        builder.Services
            .AddDefaultIdentity<User>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>();

        builder.Services.AddSingleton(TimeProvider.System);
        builder.Services.AddTransient<IIdentityService, IdentityService>();

        builder.Services.AddAuthorization(options =>
            options.AddPolicy(Policies.CanPurge, policy => policy.RequireRole(Roles.Administrator)));
    }
}