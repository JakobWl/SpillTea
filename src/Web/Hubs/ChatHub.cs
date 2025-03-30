using FadeChat.Application.Chat.Models;
using FadeChat.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FadeChat.Web.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IUser _currentUser;
    private readonly IIdentityService _identityService;
    private static readonly Dictionary<string, string> ActiveUsers = new();

    public ChatHub(IUser currentUser, IIdentityService identityService)
    {
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public override async Task OnConnectedAsync()
    {
        if (_currentUser.Id != null)
        {
            var username = await _identityService.GetUserNameAsync(_currentUser.Id);
            
            if (!string.IsNullOrEmpty(username))
            {
                ActiveUsers[Context.ConnectionId] = _currentUser.Id;
                await Clients.Others.SendAsync("UserConnected", _currentUser.Id, username);
                await Clients.Caller.SendAsync("ActiveUsers", ActiveUsers.Values.Distinct());
            }
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ActiveUsers.TryGetValue(Context.ConnectionId, out var userId))
        {
            ActiveUsers.Remove(Context.ConnectionId);
            await Clients.Others.SendAsync("UserDisconnected", userId);
        }
        
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(string message)
    {
        if (_currentUser.Id == null || string.IsNullOrEmpty(message))
            return;

        var username = await _identityService.GetUserNameAsync(_currentUser.Id) ?? "Anonymous";
        
        var chatMessage = new ChatMessage
        {
            SenderId = _currentUser.Id,
            SenderName = username,
            Content = message
        };

        await Clients.All.SendAsync("ReceiveMessage", chatMessage);
    }

    public async Task SendPrivateMessage(string recipientId, string message)
    {
        if (_currentUser.Id == null || string.IsNullOrEmpty(message))
            return;

        var username = await _identityService.GetUserNameAsync(_currentUser.Id) ?? "Anonymous";
        
        var chatMessage = new ChatMessage
        {
            SenderId = _currentUser.Id,
            SenderName = username,
            Content = message
        };

        await Clients.User(recipientId).SendAsync("ReceivePrivateMessage", chatMessage);
        await Clients.Caller.SendAsync("ReceivePrivateMessage", chatMessage);
    }
}