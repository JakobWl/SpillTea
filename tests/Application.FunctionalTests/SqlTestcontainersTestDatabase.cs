using System.Data.Common;
using SpillTea.Infrastructure.Data;
using SpillTea.Infrastructure.Data.Encryption.Interfaces;
using SpillTea.Infrastructure.Data.Encryption;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Respawn;
using Testcontainers.MsSql;

namespace SpillTea.Application.FunctionalTests;

public class SqlTestcontainersTestDatabase : ITestDatabase
{
    private const string DefaultDatabase = "SpillTeaTestDb";
    private readonly MsSqlContainer _container;
    private DbConnection _connection = null!;
    private string _connectionString = null!;
    private Respawner _respawner = null!;

    public SqlTestcontainersTestDatabase()
    {
        _container = new MsSqlBuilder()
            .WithAutoRemove(true)
            .Build();
    }

    public async Task InitialiseAsync()
    {
        await _container.StartAsync();
        await _container.ExecScriptAsync($"CREATE DATABASE {DefaultDatabase}");

        var builder = new SqlConnectionStringBuilder(_container.GetConnectionString()) {
            InitialCatalog = DefaultDatabase
        };

        _connectionString = builder.ConnectionString;

        _connection = new SqlConnection(_connectionString);

        var services = new ServiceCollection();
        services.AddEntityFrameworkSqlServer();
        services.Configure<CryptographyOptions>(options =>
        {
            options.PassPhrase = "TestPassPhrase123!";
        });
        services.AddSingleton<IStringEncryptionProvider, GenerateStringEncryptionProvider>();
        services.AddSingleton<IBinaryEncryptionProvider, GenerateBinaryEncryptionProvider>();
        var serviceProvider = services.BuildServiceProvider();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(_connectionString)
            .UseInternalServiceProvider(serviceProvider)
            .ConfigureWarnings(warnings => warnings.Log(RelationalEventId.PendingModelChangesWarning))
            .Options;

        var context = new ApplicationDbContext(options);

        await context.Database.EnsureCreatedAsync();

        _respawner = await Respawner.CreateAsync(_connectionString, new RespawnerOptions {
            TablesToIgnore = ["__EFMigrationsHistory"]
        });
    }

    public DbConnection GetConnection()
    {
        return _connection;
    }

    public string GetConnectionString()
    {
        return _connectionString;
    }

    public async Task ResetAsync()
    {
        await _respawner.ResetAsync(_connectionString);
    }

    public async Task DisposeAsync()
    {
        await _connection.DisposeAsync();
        await _container.DisposeAsync();
    }
}
