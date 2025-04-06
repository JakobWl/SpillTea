using FadeChat.Application;
using FadeChat.Application.Chat.Hubs;
using FadeChat.Domain.Entities;
using FadeChat.Infrastructure;
using FadeChat.Infrastructure.Data;
using FadeChat.Web;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.AddKeyVaultIfConfigured();
builder.AddApplicationServices();
builder.AddInfrastructureServices();
builder.AddWebServices();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    await app.InitialiseDatabaseAsync();
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

app.MapRazorPages();

// Map SignalR hubs
app.MapHub<ChatHub>("/hubs/chat");

app.MapFallbackToFile("index.html");

app.UseExceptionHandler(options => { });

app.MapEndpoints();
app.MapIdentityApi<ApplicationUser>();

app.Run();

namespace FadeChat.Web
{
    public class Program
    { }
}