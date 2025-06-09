using FadeChat.Application.Chat.Dtos;
using FadeChat.Domain.Entities;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace FadeChat.Application.FunctionalTests.Chat;

public class ChatHubTests : BaseTestFixture
{
    [Test]
    public async Task Send_and_receive_message_between_two_users_updates_state()
    {
        // Arrange - create two users
        var user1Id = await Testing.RunAsUserAsync("user1@local", "Password1!", []);
        var user1 = await Testing.ExecuteDbContextAsync(ctx => ctx.Users.FindAsync(user1Id).AsTask());
        var user2Id = await Testing.RunAsUserAsync("user2@local", "Password1!", []);
        var user2 = await Testing.ExecuteDbContextAsync(ctx => ctx.Users.FindAsync(user2Id).AsTask());

        var chat = new Chat();
        chat.Users.Add(user1!);
        chat.Users.Add(user2!);
        await Testing.ExecuteDbContextAsync(async ctx =>
        {
            ctx.Chats.Add(chat);
            await ctx.SaveChangesAsync();
        });

        using var connection1 = Testing.CreateHubConnection(user1Id);
        using var connection2 = Testing.CreateHubConnection(user2Id);

        var receivedTcs = new TaskCompletionSource<ChatMessageDto>();
        connection2.On<ChatMessageDto>("ReceiveMessage", msg => receivedTcs.TrySetResult(msg));

        await connection1.StartAsync();
        await connection2.StartAsync();

        await connection1.InvokeAsync("JoinChat", chat.Id);
        await connection2.InvokeAsync("JoinChat", chat.Id);

        var guid = Guid.NewGuid().ToString();
        var sendDto = new ChatMessageDto
        {
            ChatId = chat.Id,
            Body = "Hello",
            Guid = guid,
            SenderId = user1Id,
            State = MessageState.Sent,
            TimeStamp = DateTimeOffset.UtcNow
        };

        // Act - send message from user1
        await connection1.InvokeAsync("SendMessage", sendDto);

        var receiveTask = await Task.WhenAny(receivedTcs.Task, Task.Delay(TimeSpan.FromSeconds(5)));
        receiveTask.Should().Be(receivedTcs.Task, "message should be received via SignalR");

        var received = await receivedTcs.Task;
        received.Guid.Should().Be(guid);
        received.Body.Should().Be("Hello");

        // Assert - message persisted with Sent state
        ChatMessage? dbMessage = null;
        await WaitUntil(async () =>
        {
            dbMessage = await Testing.ExecuteDbContextAsync(ctx => ctx.ChatMessages.FirstOrDefaultAsync(m => m.Guid == guid));
            return dbMessage != null;
        });
        dbMessage!.State.Should().Be(MessageState.Sent);

        // Mark message received and verify state
        await connection2.InvokeAsync("MarkMessageReceived", chat.Id, guid);
        await WaitUntil(async () =>
        {
            dbMessage = await Testing.ExecuteDbContextAsync(ctx => ctx.ChatMessages.FirstOrDefaultAsync(m => m.Guid == guid));
            return dbMessage!.State == MessageState.Received;
        });
        dbMessage!.State.Should().Be(MessageState.Received);

        // Mark message read and verify state
        await connection2.InvokeAsync("MarkMessageRead", chat.Id, guid);
        await WaitUntil(async () =>
        {
            dbMessage = await Testing.ExecuteDbContextAsync(ctx => ctx.ChatMessages.FirstOrDefaultAsync(m => m.Guid == guid));
            return dbMessage!.State == MessageState.Read;
        });
        dbMessage!.State.Should().Be(MessageState.Read);
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
