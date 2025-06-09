using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FadeChat.Infrastructure.Data;

public static class InitialiserExtensions
{
    public static async Task InitialiseDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var initialiser = scope.ServiceProvider.GetRequiredService<ApplicationDbContextInitialiser>();

        await initialiser.InitialiseAsync();

        await initialiser.SeedAsync();
    }
}

public class ApplicationDbContextInitialiser(ILogger<ApplicationDbContextInitialiser> logger, ApplicationDbContext context)
{

    public async Task InitialiseAsync()
    {
        try
        {
            // First, populate any missing Guid values before running migrations
            await PopulateEmptyGuidsAsync();

            await context.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initialising the database.");
            throw;
        }
    }

    private async Task PopulateEmptyGuidsAsync()
    {
        try
        {
            // Check if ChatMessages table exists first
            var tableExists = await context.Database.ExecuteSqlRawAsync(
                "IF OBJECT_ID('ChatMessages', 'U') IS NOT NULL SELECT 1 ELSE SELECT 0") == 1;

            if (!tableExists) return;

            // Update any empty or null Guid values
            var updatedCount = await context.Database.ExecuteSqlRawAsync(
                "UPDATE ChatMessages SET Guid = NEWID() WHERE Guid = '' OR Guid IS NULL");

            if (updatedCount > 0)
            {
                logger.LogInformation("Updated {UpdatedCount} ChatMessage records with new Guid values.", updatedCount);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to populate empty Guid values. This may be expected on first run.");
        }
    }

    public Task SeedAsync()
    {
        try
        { }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
        return Task.CompletedTask;
    }
}