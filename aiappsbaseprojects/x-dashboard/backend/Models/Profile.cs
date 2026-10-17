namespace XDashboard.Api.Models;

public class Profile
{
    public string Handle { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string ProfilePictureUrl { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public AccountType AccountType { get; set; } = AccountType.Personal;
    public string Category { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string? PinnedPostId { get; set; }
    public DateTimeOffset JoinedAt { get; set; }
}

public class UpdateProfileRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string ProfilePictureUrl { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public AccountType AccountType { get; set; } = AccountType.Personal;
    public string Category { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string? PinnedPostId { get; set; }
}
