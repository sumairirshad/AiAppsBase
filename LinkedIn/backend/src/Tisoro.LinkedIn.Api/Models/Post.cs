namespace Tisoro.LinkedIn.Api.Models;

/// <summary>
/// One scheduled or published LinkedIn post. Covers every organic content
/// type the playbook calls for: a plain/hiring feed post, an image or
/// multi-image album, a video (reel), a document carousel (e-book /
/// whitepaper / industry study PDF), or an announcement post linking out to
/// a LinkedIn Article (LinkedIn has no public API to create an Article
/// itself — only to share a link to one already published on linkedin.com).
/// </summary>
public sealed class Post
{
    public Guid Id { get; set; }

    public PostContentType ContentType { get; set; }
    public PostStatus Status { get; set; } = PostStatus.Draft;

    /// <summary>Document title (Document posts only). LinkedIn hard limit: 255 characters.</summary>
    public string? Title { get; set; }

    /// <summary>The caption/body text. LinkedIn feed caption hard limit: 3000 characters.</summary>
    public string Body { get; set; } = "";

    /// <summary>External URL being shared (ArticleLink posts only).</summary>
    public string? ExternalLinkUrl { get; set; }

    public Guid? CaptionTemplateId { get; set; }
    public CaptionTemplate? CaptionTemplate { get; set; }

    public DateTimeOffset? ScheduledAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }

    public string? LinkedInPostUrn { get; set; }
    public string? PublishError { get; set; }
    public int PublishAttempts { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<PostMedia> Media { get; set; } = new List<PostMedia>();
}

/// <summary>Join row between Post and MediaAsset, ordered for multi-image albums.</summary>
public sealed class PostMedia
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Post Post { get; set; } = null!;
    public Guid MediaAssetId { get; set; }
    public MediaAsset MediaAsset { get; set; } = null!;
    public int SortOrder { get; set; }
}
