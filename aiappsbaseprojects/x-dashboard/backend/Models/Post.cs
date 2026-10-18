namespace XDashboard.Api.Models;

public class Post
{
    public string Id { get; set; } = string.Empty;
    public string AuthorHandle { get; set; } = string.Empty;
    public PostType Type { get; set; } = PostType.Text;
    public string Text { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public int Likes { get; set; }
    public int Reposts { get; set; }
    public int Replies { get; set; }
    public int Views { get; set; }
    public bool IsPinned { get; set; }
}

public class CreatePostRequest
{
    public PostType Type { get; set; } = PostType.Text;
    public string Text { get; set; } = string.Empty;

    /// <summary>Media ids returned by POST /api/media for images already uploaded to X via the
    /// chunked media upload flow. Required and must be non-empty when Type is Image.</summary>
    public List<string> MediaIds { get; set; } = new();
}

/// <summary>
/// The X API has no endpoint to edit a published post's content (see
/// https://docs.x.com/x-api/fundamentals/edit-posts -- edit history is readable, but creating an
/// edit is not exposed to third-party apps). RealPostStore.UpdatePostAsync always throws
/// XFeatureNotSupportedException; this request type is kept only so the controller's model
/// binding/route shape is unchanged.
/// </summary>
public class UpdatePostRequest
{
    public string Text { get; set; } = string.Empty;
}
