using System.ComponentModel.DataAnnotations;
using Tisoro.LinkedIn.Api.Models;

namespace Tisoro.LinkedIn.Api.Dtos;

public sealed class EngagementTargetRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = "";

    [MaxLength(500), Url]
    public string? LinkedInProfileUrl { get; set; }

    public string? Notes { get; set; }
}

public sealed class EngagementTargetResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? LinkedInProfileUrl { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public int PendingTaskCount { get; set; }

    public static EngagementTargetResponse FromEntity(EngagementTarget t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        LinkedInProfileUrl = t.LinkedInProfileUrl,
        Notes = t.Notes,
        CreatedAt = t.CreatedAt,
        PendingTaskCount = t.Tasks?.Count(x => x.Status == EngagementTaskStatus.Pending) ?? 0,
    };
}

public sealed class EngagementTaskRequest
{
    [Required]
    public Guid EngagementTargetId { get; set; }

    [Required]
    public EngagementActionType ActionType { get; set; }

    [MaxLength(500), Url]
    public string? SourcePostUrl { get; set; }

    public string? SuggestedText { get; set; }
}

public sealed class EngagementTaskResponse
{
    public Guid Id { get; set; }
    public Guid EngagementTargetId { get; set; }
    public string TargetName { get; set; } = "";
    public EngagementActionType ActionType { get; set; }
    public EngagementTaskStatus Status { get; set; }
    public string? SourcePostUrl { get; set; }
    public string? SuggestedText { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    public static EngagementTaskResponse FromEntity(EngagementTask t) => new()
    {
        Id = t.Id,
        EngagementTargetId = t.EngagementTargetId,
        TargetName = t.Target?.Name ?? "",
        ActionType = t.ActionType,
        Status = t.Status,
        SourcePostUrl = t.SourcePostUrl,
        SuggestedText = t.SuggestedText,
        CreatedAt = t.CreatedAt,
        CompletedAt = t.CompletedAt,
    };
}
