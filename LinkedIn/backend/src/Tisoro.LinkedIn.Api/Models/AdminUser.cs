namespace Tisoro.LinkedIn.Api.Models;

/// <summary>An internal Tisoro team member who can sign in to this app. Not a LinkedIn identity.</summary>
public sealed class AdminUser
{
    public Guid Id { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string FullName { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
