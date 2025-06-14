using SpillTea.Domain.Entities;

namespace SpillTea.Application.Chat.Dtos;

public class ChatMessageDto
{
    public int Id { get; set; }
    public string Guid { get; set; } = null!;
    public int ChatId { get; set; }
    public string SenderId { get; set; } = null!;
    public string Body { get; set; } = null!;
    public MessageState State { get; set; }
    public DateTimeOffset TimeStamp { get; set; }

    private class Mapping : Profile
    {
        public Mapping() => CreateMap<ChatMessage, ChatMessageDto>();
    }
}
