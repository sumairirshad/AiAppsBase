namespace XDashboard.Api.Models;

/// <summary>
/// A "short" is modeled as a vertical video post on X: the caption, description, and hashtags
/// are folded into the post text, and the video is the post's attached media. X has no separate
/// "Shorts" product or API -- this is the closest legitimate mapping of the feature onto what
/// the real API supports. See README for details.
/// </summary>
public class Short
{
    public string Id { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Hashtags { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public int Views { get; set; }
    public int Likes { get; set; }
    public TimeSpan Duration { get; set; }
}

public class CreateShortRequest
{
    /// <summary>Media id returned by POST /api/media for a video already uploaded to X via the
    /// chunked media upload flow.</summary>
    public string MediaId { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Hashtags { get; set; } = new();
}
