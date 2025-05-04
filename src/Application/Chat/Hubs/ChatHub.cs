using System.Collections.Concurrent;
using FadeChat.Application.Chat.Dtos;
using FadeChat.Application.Chat.Events;
using FadeChat.Application.Common.Interfaces;
using FadeChat.Application.Common.Security;
using Microsoft.AspNetCore.SignalR;

namespace FadeChat.Application.Chat.Hubs;

[Authorize]
public class ChatHub(IUser currentUser, IIdentityService identityService, IApplicationDbContext context, IMediator mediator) : Hub
{
    private static readonly ConcurrentDictionary<string, string> ActiveUsers = new();

    // For random chat matchmaking
    // This static field will hold info about a waiting client (if any)
    private static readonly Lock MatchLock = new();
    private static (TaskCompletionSource<string> tcs, string connectionId)? _sWaitingClient;

    public override async Task OnConnectedAsync()
    {
        if (currentUser.Id != null)
        {
            var username = await identityService.GetUserNameAsync(currentUser.Id);
            if (!string.IsNullOrEmpty(username))
            {
                ActiveUsers[Context.ConnectionId] = currentUser.Id;
                // Notify all other clients that a new user has connected
                await Clients.Others.SendAsync("UserConnected", currentUser.Id, username);
                // Send the list of active users to the caller
                await Clients.Caller.SendAsync("ActiveUsers", ActiveUsers.Values.Distinct());
            }
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ActiveUsers.Remove(Context.ConnectionId, out var userId))
        {
            await Clients.Others.SendAsync("UserDisconnected", userId);
        }

        // If the disconnected client was waiting for a random chat, remove them.
        lock (MatchLock)
        {
            if (_sWaitingClient.HasValue && _sWaitingClient.Value.connectionId == Context.ConnectionId)
            {
                _sWaitingClient = null;
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(ChatMessageDto chatMessageDto)
    {
        if (currentUser.Id == null)
        {
            return;
        }

        await Clients.GroupExcept(chatMessageDto.ChatId.ToString(), Context.ConnectionId).SendAsync("ReceiveMessage", chatMessageDto);

        await mediator.Publish(new ChatMessageSentEvent(chatMessageDto));
    }

    public async Task JoinChat(int chatId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, chatId.ToString());

        var username = currentUser.Id != null ? await identityService.GetUserNameAsync(currentUser.Id) : "Anonymous";
        await Clients.Group(chatId.ToString()).SendAsync("UserConnected", currentUser.Id, username);
    }

    public async Task LeaveChat(int chatId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId.ToString());

        // Optionally, notify the group that a user has left
        await Clients.Group(chatId.ToString()).SendAsync("UserDisconnected", currentUser.Id);
    }

    public async Task<int> FindRandomChat()
    {
        // Assume ActiveUsers is a thread-safe collection (e.g., ConcurrentDictionary or a lock‑protected List)
        // that holds info about connected clients, e.g., their ConnectionIds.
        var activeUsers = ActiveUsers
            .Where(u => u.Key != Context.ConnectionId)
            .ToList();

        if (activeUsers.Count == 0)
        {
            // Handle the scenario when no partner is available
            throw new InvalidOperationException("No active users available at the moment.");
        }

        // Randomly select a partner from the active users
        var random = new Random();
        var partner = activeUsers[random.Next(activeUsers.Count)];

        // Create a new chat record in the DB.
        // Assume Chat is a model with ChatId as an integer primary key (auto-incremented)
        var chat = new Domain.Entities.Chat();
        context.Chats.Add(chat);
        await context.SaveChangesAsync(); // chat.ChatId is now set

        // Convert chat.ChatId to string for group naming if needed.
        var groupName = chat.Id.ToString();

        // Add both clients to the SignalR group associated with the chat
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Groups.AddToGroupAsync(partner.Key, groupName);

        return chat.Id;
    }
}