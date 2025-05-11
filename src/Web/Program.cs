using System.Runtime.InteropServices;
using System.Text;
using FadeChat.Application;
using FadeChat.Application.Chat.Hubs;
using FadeChat.Application.User.Dtos;
using FadeChat.Infrastructure;
using FadeChat.Infrastructure.Data;
using FadeChat.Web;
using Serilog;
using Serilog.Events;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.WebHost.ConfigureKestrel(config =>
    {
        config.RequestHeaderEncodingSelector = _ => Encoding.UTF8;
        config.ResponseHeaderEncodingSelector = _ => Encoding.UTF8;
    });

    builder.Host.UseSerilog((context, _, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration));

    // Add services to the container.
    builder.AddKeyVaultIfConfigured();
    builder.AddApplicationServices();
    builder.AddInfrastructureServices();
    builder.AddWebServices();

    builder.Logging.ClearProviders();

    builder.Services.Configure<JwtOptions>(
        builder.Configuration.GetSection(JwtOptions.JwtOptionsKey));

    PrintBanner(builder, builder.Configuration.GetSection("ASPNETCORE_ENVIRONMENT").Value ?? string.Empty);

    var app = builder.Build();

    app.UseSerilogRequestLogging(x =>
    {
        x.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    });

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        await app.InitialiseDatabaseAsync();
        app.UseDeveloperExceptionPage();
        app.UseSwaggerUi(settings =>
        {
            settings.Path = "/swagger";
            settings.DocumentPath = "/swagger/specification.json";
        });
    }
    else
    {
        // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
        app.UseHsts();
    }

    app.UseHealthChecks("/health");

    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    app.UseStaticFiles();

    app.UseSwaggerUi(settings =>
    {
        settings.Path = "/api";
        settings.DocumentPath = "/api/specification.json";
    });

    app.UseCors();

    // Add authentication middleware
    app.UseAuthentication();
    app.UseAuthorization();

    // Map SignalR hubs
    app.MapHub<ChatHub>("/hubs/chat");

    app.MapFallbackToFile("index.html");

    app.UseExceptionHandler(_ => { });

    app.MapEndpoints();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Exception caused the application to stop");
    throw;
}
finally
{
    await Log.CloseAndFlushAsync();
}


#region private functions

static void PrintBanner(WebApplicationBuilder appBuilder, string env)
{
    // https://patorjk.com/software/taag/#p=display&f=Doom&t=FadeChat
    const string banner = """
                          ______        _      _____ _           _   
                          |  ___|      | |    /  __ \ |         | |  
                          | |_ __ _  __| | ___| /  \/ |__   __ _| |_ 
                          |  _/ _` |/ _` |/ _ \ |   | '_ \ / _` | __|
                          | || (_| | (_| |  __/ \__/\ | | | (_| | |_ 
                          \_| \__,_|\__,_|\___|\____/_| |_|\__,_|\__|
                          """;
    Console.ForegroundColor = ConsoleColor.Cyan;
    Console.WriteLine(banner);
    Console.ResetColor();
    Console.WriteLine(new string('-', 80));
    var urls = appBuilder.WebHost
        .GetSetting(WebHostDefaults.ServerUrlsKey)?
        .Replace(";", " "); // make clickable

    Console.Write("API: ");
    Console.ForegroundColor = ConsoleColor.DarkCyan;
    Console.WriteLine($"{urls}", ConsoleColor.DarkCyan);
    Console.ResetColor();

    Console.Write("Healthcheck: ");
    Console.ForegroundColor = ConsoleColor.DarkCyan;
    if (urls != null)
    {
        Console.WriteLine($"{urls.Replace(" ", "/health ")}/health", ConsoleColor.DarkCyan);
    }

    Console.ResetColor();

    if (appBuilder.Environment.IsDevelopment())
    {
        Console.Write("Swagger: ");
        Console.ForegroundColor = ConsoleColor.DarkCyan;
        if (urls != null)
        {
            Console.WriteLine($"{urls.Replace(" ", "/swagger ")}/swagger", ConsoleColor.DarkCyan);
        }

        Console.ResetColor();
    }

    Console.ResetColor();

    Console.WriteLine($"Runtime: {RuntimeInformation.FrameworkDescription} - {env}");
    Console.WriteLine($"Platform: {RuntimeInformation.OSDescription}");
    Console.WriteLine(new string('-', 80));
    Console.WriteLine();
}

#endregion

namespace FadeChat.Web
{
    public class Program;
}