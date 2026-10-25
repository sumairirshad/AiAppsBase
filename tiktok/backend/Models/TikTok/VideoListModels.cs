using System.Text.Json.Serialization;

namespace TikTok.Api.Models.TikTok;

public class VideoListRequest
{
    [JsonPropertyName("max_count")]
    public int MaxCount { get; set; } = 20;

    [JsonPropertyName("cursor")]
    public long? Cursor { get; set; }
}

public class VideoListEnvelope
{
    [JsonPropertyName("data")]
    public VideoListData Data { get; set; } = new();

    [JsonPropertyName("error")]
    public TikTokApiError Error { get; set; } = new();
}

public class VideoListData
{
    [JsonPropertyName("videos")]
    public List<VideoListItem> Videos { get; set; } = new();

    [JsonPropertyName("cursor")]
    public long Cursor { get; set; }

    [JsonPropertyName("has_more")]
    public bool HasMore { get; set; }
}

public class VideoListItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("view_count")]
    public long ViewCount { get; set; }

    [JsonPropertyName("like_count")]
    public long LikeCount { get; set; }

    [JsonPropertyName("comment_count")]
    public long CommentCount { get; set; }

    [JsonPropertyName("share_count")]
    public long ShareCount { get; set; }

    [JsonPropertyName("create_time")]
    public long CreateTime { get; set; }
}
