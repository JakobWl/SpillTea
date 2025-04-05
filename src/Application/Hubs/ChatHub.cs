using System.Collections.Concurrent;
using FadeChat.Application.Chat.Models;
using FadeChat.Application.Common.Interfaces;
using FadeChat.Application.Common.Security;
using Microsoft.AspNetCore.SignalR;

namespace FadeChat.Application.Hubs;

[Authorize]
public class ChatHub(IUser currentUser, IIdentityService identityService) : Hub
{
    private static readonly ConcurrentDictionary<string, string> ActiveUsers = new();

    // For random chat matchmaking
    // This static field will hold info about a waiting client (if any)
    private static readonly Lock MatchLock = new();
    private static (TaskCompletionSource<string> tcs, string connectionId)? s_waitingClient;

    public override async Task OnConnectedAsync()
    {
        if (currentUser.Id != null)
        {
            string? username = await identityService.GetUserNameAsync(currentUser.Id);
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
        if (ActiveUsers.Remove(Context.ConnectionId, out string? userId))
        {
            await Clients.Others.SendAsync("UserDisconnected", userId);
        }

        // If the disconnected client was waiting for a random chat, remove them.
        lock (MatchLock)
        {
            if (s_waitingClient.HasValue && s_waitingClient.Value.connectionId == Context.ConnectionId)
            {
                s_waitingClient = null;
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(string message)
    {
        if (currentUser.Id == null || string.IsNullOrEmpty(message))
        {
            return;
        }

        string username = await identityService.GetUserNameAsync(currentUser.Id) ?? "Anonymous";
        ChatMessage chatMessage = new()
        {
            SenderId = currentUser.Id, SenderName = username, Content = message
        };

        // Broadcast the message to all connected clients
        await Clients.All.SendAsync("ReceiveMessage", chatMessage);
    }

    public async Task SendPrivateMessage(string recipientId, string message)
    {
        if (currentUser.Id == null || string.IsNullOrEmpty(message))
        {
            return;
        }

        string username = await identityService.GetUserNameAsync(currentUser.Id) ?? "Anonymous";
        ChatMessage chatMessage = new()
        {
            SenderId = currentUser.Id, SenderName = username, Content = message
        };

        // Send the private message to the recipient and echo it back to the caller
        await Clients.User(recipientId).SendAsync("ReceivePrivateMessage", chatMessage);
        await Clients.Caller.SendAsync("ReceivePrivateMessage", chatMessage);
    }

    public async Task JoinChat(string chatId)
    {
        if (string.IsNullOrEmpty(chatId))
        {
            return;
        }

        // Add the caller's connection to the SignalR group with the given chatId
        await Groups.AddToGroupAsync(Context.ConnectionId, chatId);

        // Optionally, notify the group that a user has joined
        string? username = currentUser.Id != null ? await identityService.GetUserNameAsync(currentUser.Id) : "Anonymous";
        await Clients.Group(chatId).SendAsync("UserConnected", currentUser.Id, username);
    }

    public async Task LeaveChat(string chatId)
    {
        if (string.IsNullOrEmpty(chatId))
        {
            return;
        }

        // Remove the caller's connection from the SignalR group
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);

        // Optionally, notify the group that a user has left
        await Clients.Group(chatId).SendAsync("UserDisconnected", currentUser.Id);
    }

    public async Task<string> FindRandomChat()
    {
        (TaskCompletionSource<string> tcs, string partnerConnectionId)? partnerInfo = null;
        bool isPairing = false;
        TaskCompletionSource<string>? localTcs = null; // local copy for waiting client

        // Use a lock to safely access the waiting client info
        lock (MatchLock)
        {
            if (s_waitingClient == null)
            {
                // No one is waiting – mark this client as waiting for a match
                localTcs = new TaskCompletionSource<string>();
                s_waitingClient = (localTcs, Context.ConnectionId);
            }
            else
            {
                // A waiting client exists – pair this client with the waiting one
                partnerInfo = s_waitingClient;
                s_waitingClient = null;
                isPairing = true;
            }
        }

        if (!isPairing && localTcs != null)
        {
            // Await a match from a future client using the local TCS
            string chatId = await localTcs.Task;
            // Once matched, join the chat group
            await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
            return chatId;
        }
        else
        {
            // Create a new chat ID for the pair
            string chatId = Guid.NewGuid().ToString();

            // Add both clients to the new chat group
            await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
            await Groups.AddToGroupAsync(partnerInfo!.Value.partnerConnectionId, chatId);

            // Complete the waiting client’s task so they receive the chat ID
            partnerInfo.Value.tcs.SetResult(chatId);

            return chatId;
        }
    }
}
