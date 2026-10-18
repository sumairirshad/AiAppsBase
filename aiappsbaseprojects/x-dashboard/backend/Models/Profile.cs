namespace XDashboard.Api.Models;

public class Profile
{
    public string Handle { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string ProfilePictureUrl { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;

    /// <summary>Best-effort derived from X's verified_type (business = Business); X exposes no
    /// direct "account type" field over the API. See README for details.</summary>
    public AccountType AccountType { get; set; } = AccountType.Personal;

    /// <summary>Always empty: professional account category is not exposed by the X API.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Always empty: contact info is not exposed by the X API.</summary>
    public string Phone { get; set; } = string.Empty;

    /// <summary>Always empty: contact info is not exposed by the X API.</summary>
    public string Email { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string? PinnedPostId { get; set; }
    public DateTimeOffset JoinedAt { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
}

/// <summary>
/// Fields the X API actually supports updating, via the legacy v1.1
/// POST account/update_profile endpoint (see XApiClient.UpdateLegacyProfileAsync). Account type,
/// category, phone and email have no corresponding write endpoint and are intentionally not
/// included here -- see the Profile model and README for why.
/// </summary>
public class UpdateProfileRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string? PinnedPostId { get; set; }
}
