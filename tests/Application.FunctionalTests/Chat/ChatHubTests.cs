using System.Diagnostics;
using SpillTea.Application.Chat.Dtos;
using SpillTea.Domain.Entities;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.EntityFrameworkCore;

namespace SpillTea.Application.FunctionalTests.Chat;

public class ChatHubTests : BaseTestFixture
{
    [Test]
    public async Task Send_and_receive_message_between_two_users_updates_state()
    {
        // Arrange - create two users
        var user1Id = await Testing.RunAsUserAsync("user1@local", "Password1!", []);
        var user2Id = await Testing.RunAsUserAsync("user2@local", "Password1!", []);

        var chat = new Domain.Entities.Chat {
            LastMessage = "",
            LastMessageSenderId = user1Id
        };

        await Testing.ExecuteDbContextAsync(async ctx =>
        {
            var user1 = await ctx.Users.FindAsync(user1Id);
            var user2 = await ctx.Users.FindAsync(user2Id);

            chat.Users.Add(user1!);
            chat.Users.Add(user2!);
            ctx.Chats.Add(chat);
            await ctx.SaveChangesAsync();
        });

        // Verify initial database state - no messages
        var initialMessageCount = await Testing.CountAsync<ChatMessage>();
        initialMessageCount.Should().Be(0, "there should be no messages initially");

        await using var connection1 = Testing.CreateHubConnection(user1Id);
        await using var connection2 = Testing.CreateHubConnection(user2Id);

        // Setup SignalR event handlers for both users
        var user2ReceivedMessageTcs = new TaskCompletionSource<ChatMessageDto>();
        var user1MessageReceivedNotificationTcs = new TaskCompletionSource<ChatMessageDto>();
        var user1MessageReadNotificationTcs = new TaskCompletionSource<ChatMessageDto>();

        connection2.On<ChatMessageDto>("ReceiveMessage", msg => user2ReceivedMessageTcs.TrySetResult(msg));

        // Critical: User1 should receive updated message objects when User2 marks their message as received/read
        connection1.On<ChatMessageDto>("MessageReceived", (updatedMessage) =>
        {
            Console.WriteLine($"TEST: User1 received MessageReceived notification - messageGuid: '{updatedMessage.Guid}', state: '{updatedMessage.State}'");
            user1MessageReceivedNotificationTcs.TrySetResult(updatedMessage);
        });
        connection1.On<ChatMessageDto>("MessageRead", (updatedMessage) =>
        {
            Console.WriteLine($"TEST: User1 received MessageRead notification - messageGuid: '{updatedMessage.Guid}', state: '{updatedMessage.State}'");
            user1MessageReadNotificationTcs.TrySetResult(updatedMessage);
        });

        try
        {
            await connection1.StartAsync();
            await connection2.StartAsync();
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to start SignalR connections: {ex.Message}", ex);
        }

        connection1.State.Should().Be(Microsoft.AspNetCore.SignalR.Client.HubConnectionState.Connected);
        connection2.State.Should().Be(Microsoft.AspNetCore.SignalR.Client.HubConnectionState.Connected);

        await connection1.InvokeAsync("JoinChat", chat.Id);
        await connection2.InvokeAsync("JoinChat", chat.Id);

        var guid = Guid.NewGuid().ToString();
        var messageBody = "Hello from functional test!";
        var sendTimestamp = DateTimeOffset.UtcNow;
        var sendDto = new ChatMessageDto {
            ChatId = chat.Id,
            Body = messageBody,
            Guid = guid,
            SenderId = user1Id,
            State = MessageState.Sent,
            TimeStamp = sendTimestamp
        };

        Console.WriteLine($"TEST: Sending message with GUID: '{guid}'");

        // Act 1 - User1 sends message
        await connection1.InvokeAsync("SendMessage", sendDto);

        // Verify User2 receives the message via SignalR
        var receiveTask = await Task.WhenAny(user2ReceivedMessageTcs.Task, Task.Delay(TimeSpan.FromSeconds(5)));
        receiveTask.Should().Be(user2ReceivedMessageTcs.Task, "User2 should receive the message via SignalR");

        var receivedMessage = await user2ReceivedMessageTcs.Task;
        receivedMessage.Guid.Should().Be(guid);
        receivedMessage.Body.Should().Be(messageBody);
        receivedMessage.SenderId.Should().Be(user1Id);

        // Verify message is persisted in database with Sent state
        ChatMessage? dbMessage = null;
        await WaitUntil(async () =>
        {
            dbMessage = await Testing.ExecuteDbContextAsync(ctx =>
                ctx.ChatMessages.FirstOrDefaultAsync(m => m.Guid == guid));
            return dbMessage != null;
        }, timeoutMs: 5000);

        dbMessage.Should().NotBeNull("message should be persisted in database");
        dbMessage!.State.Should().Be(MessageState.Sent, "initial message state should be Sent");
        dbMessage.Body.Should().Be(messageBody, "message body should be correctly stored");
        dbMessage.SenderId.Should().Be(user1Id, "sender ID should be correct");
        dbMessage.ChatId.Should().Be(chat.Id, "chat ID should be correct");
        dbMessage.Created.Should().BeCloseTo(sendTimestamp, TimeSpan.FromSeconds(10), "timestamp should be close to send time");

        var messageCountAfterSend = await Testing.CountAsync<ChatMessage>();
        messageCountAfterSend.Should().Be(1, "there should be exactly one message after sending");

        // Act 2 - User2 marks message as received (CRITICAL FRONTEND TEST)
        Console.WriteLine($"TEST: User2 marking message as received - chatId: {chat.Id}, messageGuid: '{guid}'");
        await connection2.InvokeAsync("MarkMessageReceived", chat.Id, guid);

        // Verify User1 receives the "MessageReceived" notification via SignalR
        var receivedNotificationTask = await Task.WhenAny(user1MessageReceivedNotificationTcs.Task, Task.Delay(TimeSpan.FromSeconds(5)));
        receivedNotificationTask.Should().Be(user1MessageReceivedNotificationTcs.Task,
            "User1 (sender) should receive MessageReceived notification via SignalR when User2 marks message as received");

        var receivedNotificationMessage = await user1MessageReceivedNotificationTcs.Task;
        receivedNotificationMessage.Guid.Should().Be(guid, "notification should be for the correct message");
        receivedNotificationMessage.State.Should().Be(MessageState.Received, "message should be updated to Received state");
        receivedNotificationMessage.SenderId.Should().Be(user1Id, "message sender should remain the original sender");

        // Verify state is updated in database (visible to User1's queries)
        await WaitUntil(async () =>
        {
            dbMessage = await Testing.ExecuteDbContextAsync(ctx =>
                ctx.ChatMessages.FirstOrDefaultAsync(m => m.Guid == guid));
            return dbMessage?.State == MessageState.Received;
        }, timeoutMs: 5000);

        dbMessage.Should().NotBeNull("message should still exist in database");
        dbMessage!.State.Should().Be(MessageState.Received, "message state should be updated to Received in database");
        dbMessage.Body.Should().Be(messageBody, "message body should remain unchanged");
        dbMessage.SenderId.Should().Be(user1Id, "sender ID should remain unchanged");

        var messageCountAfterReceived = await Testing.CountAsync<ChatMessage>();
        messageCountAfterReceived.Should().Be(1, "message count should remain the same");

        // Act 3 - User2 marks message as read (CRITICAL FRONTEND TEST)
        Console.WriteLine($"TEST: User2 marking message as read - chatId: {chat.Id}, messageGuid: '{guid}'");
        await connection2.InvokeAsync("MarkMessageRead", chat.Id, guid);

        // Verify User1 receives the "MessageRead" notification via SignalR
        var readNotificationTask = await Task.WhenAny(user1MessageReadNotificationTcs.Task, Task.Delay(TimeSpan.FromSeconds(5)));
        readNotificationTask.Should().Be(user1MessageReadNotificationTcs.Task,
            "User1 (sender) should receive MessageRead notification via SignalR when User2 marks message as read");

        var readNotificationMessage = await user1MessageReadNotificationTcs.Task;
        readNotificationMessage.Guid.Should().Be(guid, "notification should be for the correct message");
        readNotificationMessage.State.Should().Be(MessageState.Read, "message should be updated to Read state");
        readNotificationMessage.SenderId.Should().Be(user1Id, "message sender should remain the original sender");

        // Verify final state is updated in database (visible to User1's queries)
        await WaitUntil(async () =>
        {
            dbMessage = await Testing.ExecuteDbContextAsync(ctx =>
                ctx.ChatMessages.FirstOrDefaultAsync(m => m.Guid == guid));
            return dbMessage?.State == MessageState.Read;
        }, timeoutMs: 5000);

        dbMessage.Should().NotBeNull("message should still exist in database");
        dbMessage!.State.Should().Be(MessageState.Read, "final message state should be Read in database");
        dbMessage.Body.Should().Be(messageBody, "message body should remain unchanged throughout all state changes");
        dbMessage.SenderId.Should().Be(user1Id, "sender ID should remain unchanged throughout all state changes");
        dbMessage.ChatId.Should().Be(chat.Id, "chat ID should remain unchanged throughout all state changes");

        var finalMessageCount = await Testing.CountAsync<ChatMessage>();
        finalMessageCount.Should().Be(1, "there should still be exactly one message at the end");

        // Verify chat's last message was updated
        var updatedChat = await Testing.FindAsync<Domain.Entities.Chat>(chat.Id);
        updatedChat.Should().NotBeNull("chat should still exist");
        updatedChat!.LastMessage.Should().Be(messageBody, "chat's last message should be updated");
        updatedChat.LastMessageSenderId.Should().Be(user1Id, "chat's last message sender should be correct");

        // FRONTEND VALIDATION: Verify User1 can query the updated message state from database
        var finalMessageFromUser1Perspective = await Testing.ExecuteDbContextAsync(async ctx =>
        {
            // Simulate how the frontend would query for message updates
            return await ctx.ChatMessages
                .Where(m => m.ChatId == chat.Id && m.SenderId == user1Id)
                .FirstOrDefaultAsync(m => m.Guid == guid);
        });

        finalMessageFromUser1Perspective.Should().NotBeNull("User1 should be able to query their sent message");
        finalMessageFromUser1Perspective!.State.Should().Be(MessageState.Read,
            "User1 should see the updated Read state when querying the database (critical for frontend state updates)");
    }

    private static async Task WaitUntil(Func<Task<bool>> condition, int timeoutMs = 5000, int delayMs = 100)
    {
        var sw = Stopwatch.StartNew();
        while (sw.ElapsedMilliseconds < timeoutMs)
        {
            if (await condition())
                return;
            await Task.Delay(delayMs);
        }
        throw new TimeoutException("Condition not met within timeout");
    }
}
