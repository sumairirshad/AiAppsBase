namespace XDashboard.Api.Options;

/// <summary>
/// Key material used to encrypt X OAuth tokens at rest in the server-side token store.
/// Populated from the TOKEN_ENCRYPTION_KEY environment variable: a base64-encoded 32-byte
/// (256-bit) key. Generate one with: openssl rand -base64 32
/// </summary>
public class SecurityOptions
{
    public const string SectionName = "Security";

    public string TokenEncryptionKey { get; set; } = string.Empty;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(TokenEncryptionKey);
}
