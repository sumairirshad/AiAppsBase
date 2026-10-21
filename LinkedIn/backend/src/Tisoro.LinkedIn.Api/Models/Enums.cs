namespace Tisoro.LinkedIn.Api.Models;

/// <summary>
/// What kind of LinkedIn post this is. Maps to the "Content Types" sheet in the
/// Tisoro LinkedIn content playbook: long-form document shares (articles,
/// e-books/whitepapers/industry studies as carousel PDFs), reels (video),
/// multi-image album posts, and plain hiring/feed posts.
/// </summary>
public enum PostContentType
{
    Text = 0,
    Image = 1,
    MultiImage = 2,
    Video = 3,
    Document = 4,
    ArticleLink = 5,
}

public enum PostStatus
{
    Draft = 0,
    Scheduled = 1,
    Publishing = 2,
    Published = 3,
    Failed = 4,
}

public enum MediaKind
{
    Image = 0,
    Video = 1,
    Document = 2,
}

public enum EngagementActionType
{
    Comment = 0,
    Reaction = 1,
    Repost = 2,
}

public enum EngagementTaskStatus
{
    Pending = 0,
    Done = 1,
    Dismissed = 2,
}
