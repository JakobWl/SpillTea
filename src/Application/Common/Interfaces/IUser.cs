namespace SpillTea.Application.Common.Interfaces;

public interface IUser
{
    string? Tag { get; }
    string? Id { get; }
    string? Name { get; }
    string? Email { get; }
    string? DisplayName { get; }
    int? Age { get; }
    string? Gender { get; }
}
