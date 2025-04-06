namespace FadeChat.Application.Chat.Dtos;

public class ChatDto
{
    public int Id { get; set; }
    public int UnreadCount { get; set; }
    public DateTimeOffset LastModified { get; set; }
    public string LastMessage { get; set; } = null!;

    private class Mapping : Profile
    {
        public Mapping() => CreateMap<Domain.Entities.Chat, ChatDto>();
    }
}