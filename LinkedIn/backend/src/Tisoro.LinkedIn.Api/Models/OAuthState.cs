namespace Tisoro.LinkedIn.Api.Models;

/// <summary>
/// Short-lived CSRF nonce for the LinkedIn OAuth round trip. The browser is
/// redirected to LinkedIn and back outside of any JWT-authenticated request,
/// so this is what lets the public callback recover which admin started the
/// connection and reject a forged or replayed callback.
/// </summary>
public sealed class OAuthState
{
    public Guid Id { get; set; }
    public string State { get; set; } = "";
    public Guid AdminUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAt { get; set; }
    public bool Consumed { get; set; }
}
