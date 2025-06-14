using System.Collections.Concurrent;
using System.Text.Json;
using SpillTea.Application.Chat.Dtos;
using SpillTea.Application.Chat.Events;
using SpillTea.Application.Common.Interfaces;
using SpillTea.Application.Common.Security;
using SpillTea.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Distributed;

namespace SpillTea.Application.Chat.Hubs;

using User = Domain.Entities.User;

[Authorize]
public class ChatHub(IUser currentUser, IIdentityService identityService, IApplicationDbContext context, UserManager<User> userManager, IMediator mediator, IDistributedCache cache) : Hub
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

        await ChatMessageSentEventHandler.AddPendingMessageAsync(cache, chatMessageDto.Guid, chatMessageDto);

        await Clients.GroupExcept(chatMessageDto.ChatId.ToString(), Context.ConnectionId).SendAsync("ReceiveMessage", chatMessageDto);

        await mediator.Publish(new ChatMessageSentEvent(chatMessageDto));
    }

    public async Task MarkMessageReceived(int chatId, string messageGuid)
    {
        if (currentUser.Id == null)
        {
            return;
        }

        // Load the complete message from cache
        var cachedMessage = await GetPendingMessageAsync(cache, messageGuid);
        if (cachedMessage != null)
        {
            // Update the message state
            cachedMessage.State = MessageState.Received;

            // Send the complete updated message to other clients
            await Clients.GroupExcept(chatId.ToString(), Context.ConnectionId)
                .SendAsync("MessageReceived", cachedMessage);
        }

        await mediator.Publish(new ChatMessageReceivedEvent(null, currentUser.Id, messageGuid));
    }

    public async Task MarkMessageRead(int chatId, string messageGuid)
    {
        if (currentUser.Id == null)
        {
            return;
        }

        // Load the complete message from cache
        var cachedMessage = await GetPendingMessageAsync(cache, messageGuid);
        if (cachedMessage != null)
        {
            // Update the message state
            cachedMessage.State = MessageState.Read;

            // Send the complete updated message to other clients
            await Clients.GroupExcept(chatId.ToString(), Context.ConnectionId)
                .SendAsync("MessageRead", cachedMessage);
        }

        await mediator.Publish(new ChatMessageReadEvent(null, currentUser.Id, messageGuid));
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

    public async Task<int> FindRandomChat() => await FindRandomChatWithFilters(null);

    public async Task<int> FindRandomChatWithFilters(SearchFiltersDto? filters)
    {
        if (currentUser.Id == null)
        {
            throw new InvalidOperationException("User not authenticated.");
        }

        // Get current user's demographics
        var currentUserEntity = await userManager.FindByIdAsync(currentUser.Id);

        if (currentUserEntity == null)
        {
            throw new InvalidOperationException("Current user not found.");
        }

        // Get all active users except current user
        var activeUserIds = ActiveUsers
            .Where(u => u.Key != Context.ConnectionId)
            .Select(u => u.Value)
            .ToList();

        if (activeUserIds.Count == 0)
        {
            throw new InvalidOperationException("No active users available at the moment.");
        }

        // Get user entities with demographics for filtering using UserManager
        var candidateUsers = new List<User>();
        foreach (var userId in activeUserIds)
        {
            var user = await userManager.FindByIdAsync(userId);
            if (user != null)
            {
                candidateUsers.Add(user);
            }
        }

        // Apply filters if provided
        if (filters != null)
        {
            candidateUsers = ApplySearchFilters(candidateUsers, currentUserEntity, filters);
        }

        if (candidateUsers.Count == 0)
        {
            throw new InvalidOperationException("No users match your search criteria at the moment.");
        }

        // Randomly select a partner from filtered candidates
        var random = new Random();
        var selectedUser = candidateUsers[random.Next(candidateUsers.Count)];

        // Find the connection ID for the selected user
        var partnerConnectionId = ActiveUsers
            .FirstOrDefault(u => u.Value == selectedUser.Id).Key;

        if (string.IsNullOrEmpty(partnerConnectionId))
        {
            throw new InvalidOperationException("Selected user is no longer available.");
        }

        // Create a new chat record in the DB
        var chat = new Domain.Entities.Chat();
        context.Chats.Add(chat);
        await context.SaveChangesAsync();

        // Add both clients to the SignalR group associated with the chat
        var groupName = chat.Id.ToString();
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Groups.AddToGroupAsync(partnerConnectionId, groupName);

        return chat.Id;
    }

    private List<User> ApplySearchFilters(
        List<User> candidates,
        User currentUserEntity,
        SearchFiltersDto filters)
    {
        var filtered = candidates.AsEnumerable();

        // Apply age range filter
        if (filters.AgeRangeEnabled && currentUserEntity.Age.HasValue)
        {
            filtered = filtered.Where(u => u.Age.HasValue &&
                                           u.Age >= filters.MinAge &&
                                           u.Age <= filters.MaxAge);
        }

        // Apply gender preference filter
        if (filters.GenderPreferences.Any())
        {
            filtered = filtered.Where(u => !string.IsNullOrEmpty(u.Gender) &&
                                           filters.GenderPreferences.Contains(u.Gender));
        }

        // Apply same age group filter (within 5 years)
        if (filters.SameAgeGroupOnly && currentUserEntity.Age.HasValue)
        {
            filtered = filtered.Where(u => u.Age.HasValue &&
                                           Math.Abs(u.Age.Value - currentUserEntity.Age.Value) <= 5);
        }

        return filtered.ToList();
    }

    private static async Task<ChatMessageDto?> GetPendingMessageAsync(IDistributedCache cache, string guid)
    {
        const string PENDING_MESSAGE_PREFIX = "pending_message:";
        var key = PENDING_MESSAGE_PREFIX + guid;
        var value = await cache.GetStringAsync(key);

        if (string.IsNullOrEmpty(value))
            return null;

        return JsonSerializer.Deserialize<ChatMessageDto>(value);
    }
}
