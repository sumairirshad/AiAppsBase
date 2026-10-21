namespace Tisoro.LinkedIn.Api.Models;

/// <summary>
/// A LinkedIn profile Tisoro tracks for engagement (per the playbook's
/// "Activity Concept": people co-authoring documents with Tisoro, etc).
/// LinkedIn's API does not allow posting comments/reactions on another
/// member's behalf — the playbook itself describes this as a human posting
/// manually from an AI-recommended suggestion, which is exactly what
/// EngagementTask tracks.
/// </summary>
public sealed class EngagementTarget
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? LinkedInProfileUrl { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<EngagementTask> Tasks { get; set; } = new List<EngagementTask>();
}

/// <summary>A suggested, manually-executed engagement action against a target's new activity.</summary>
public sealed class EngagementTask
{
    public Guid Id { get; set; }
    public Guid EngagementTargetId { get; set; }
    public EngagementTarget Target { get; set; } = null!;

    public EngagementActionType ActionType { get; set; }
    public EngagementTaskStatus Status { get; set; } = EngagementTaskStatus.Pending;

    /// <summary>The source post/publication that prompted this suggestion.</summary>
    public string? SourcePostUrl { get; set; }

    /// <summary>The suggested comment text, or null for a Reaction/Repost task.</summary>
    public string? SuggestedText { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
}
